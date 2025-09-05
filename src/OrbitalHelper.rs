//! lib.rs: Arbitrum Stylus contract for Orbital AMM mathematical computations.
#![cfg_attr(not(feature = "export-abi"), no_main)]
#![allow(non_snake_case)] // Allows camelCase function names to match Solidity.

extern crate alloc;

/// Use the Stylus SDK prelude, which brings in many common types and macros.
use stylus_sdk::{alloy_primitives::U256, prelude::*};

// ===================================================================
//
//                        CONSTANTS AND STRUCTS
//
// ===================================================================

/// Number of tokens in the pool, matching the Solidity contract.
const TOKENS_COUNT: usize = 5;
/// Precision constant, equivalent to 1e15 in the new Solidity contract.
const PRECISION: f64 = 1_000_000_000_000_000.0;
/// sqrt(5) for f64 calculations. The Solidity version is scaled.
const SQRT5: f64 = 2.23606797749979;

/// Represents the consolidated data calculated in Solidity and passed to the helper.
#[solidity_type(name = "ConsolidatedData")]
#[derive(Sol, Clone, Default, Copy)]
pub struct ConsolidatedData {
    sum_interior_reserves: U256,
    interior_consolidated_radius: U256,
    boundary_consolidated_radius: U256,
    boundary_total_k_bound: U256,
}

/// Internal struct for holding f64 versions of the consolidated data.
#[derive(Clone, Default, Copy)]
struct ConsolidatedDataF64 {
    sum_interior_reserves: f64,
    interior_consolidated_radius: f64,
    boundary_consolidated_radius: f64,
    boundary_total_k_bound: f64,
}

#[solidity_storage]
#[entrypoint]
pub struct OrbitalMathHelper;

/// Defines descriptive errors for the contract.
#[derive(Sol, MappedEVMError)]
pub enum MathError {
    #[error("Invalid array length")]
    InvalidArrayLength,
    #[error("Insufficient liquidity")]
    InsufficientLiquidity,
    #[error("Newton's method failed to converge")]
    ConvergenceError,
    #[error("Invalid token index")]
    InvalidTokenIndex,
    #[error("Calculation resulted in negative square root")]
    NegativeSqrt,
}

// ===================================================================
//
//                  ORBITAL MATH HELPER IMPLEMENTATION
//
// ===================================================================

#[external]
impl OrbitalMathHelper {
    /// @notice Calculates the output amount for a swap by solving the torus invariant.
    /// @dev Implements a robust version of Newton's method for root-finding.
    pub fn solveTorusInvariant(
        &self,
        consolidated_data: ConsolidatedData,
        total_reserves: Vec<U256>,
        token_in_index: U256,
        token_out_index: U256,
        amount_in_after_fee: U256,
    ) -> Result<U256, MathError> {
        let token_in_idx = token_in_index.to::<usize>();
        let token_out_idx = token_out_index.to::<usize>();

        // --- 1. Input validation ---
        if token_in_idx >= TOKENS_COUNT || token_out_idx >= TOKENS_COUNT {
            return Err(MathError::InvalidTokenIndex);
        }
        if total_reserves.len() != TOKENS_COUNT {
            return Err(MathError::InvalidArrayLength);
        }
        if amount_in_after_fee.is_zero() {
            return Ok(U256::ZERO);
        }

        // --- 2. Convert to f64 and calculate initial state ---
        let reserves_f64: Vec<f64> = total_reserves.iter().map(|&r| self.to_f64(r)).collect();
        let amount_in_f64 = self.to_f64(amount_in_after_fee);
        let consolidated_f64 = self.to_consolidated_f64(consolidated_data);

        let initial_invariant = self._computeTorusInvariant(&consolidated_f64, &reserves_f64)?;
        if initial_invariant == 0.0 {
            return Ok(U256::ZERO);
        }

        // --- 3. Initial guess (using constant product approximation) ---
        let r_in = reserves_f64[token_in_idx];
        let r_out = reserves_f64[token_out_idx];
        let mut y = (amount_in_f64 * r_out) / (r_in + amount_in_f64);
        
        // Boundary checks for the initial guess
        if y <= 0.0 { y = amount_in_f64 / 10.0; }
        if y >= r_out { y = r_out * 0.5; }

        // --- 4. Define f(y) for the root-finding equation f(y) = new_invariant - initial_invariant = 0 ---
        let f = |y_val: f64| -> Result<f64, MathError> {
            if y_val < 0.0 { return Err(MathError::InsufficientLiquidity); }
            let mut new_reserves = reserves_f64.clone();
            new_reserves[token_in_idx] += amount_in_f64;
            if new_reserves[token_out_idx] < y_val { return Err(MathError::InsufficientLiquidity); }
            new_reserves[token_out_idx] -= y_val;
            let new_inv = self._computeTorusInvariant(&consolidated_f64, &new_reserves)?;
            Ok(new_inv - initial_invariant)
        };

        // --- 5. Newton's Method Iteration ---
        const MAX_ITER: usize = 30;
        let tol = (initial_invariant / 1e6).abs(); // Relative tolerance

        let mut f_y = f(y)?;
        for _ in 0..MAX_ITER {
            if f_y.abs() <= tol { break; }

            // Adaptive epsilon and central difference for a more accurate derivative
            let eps = (y.abs() * 1e-3).max(1e-12);
            let f_plus = f(y + eps)?;
            let f_minus = f((y - eps).max(0.0))?;
            let deriv = (f_plus - f_minus) / (2.0 * eps);

            if deriv.abs() < tol / 1000.0 {
                // Derivative is too small, fallback to a manual adjustment
                y += if f_y > 0.0 { y * 0.1 } else { -(y * 0.1) };
            } else {
                // Newton step with a clamped delta to prevent overshooting
                let mut delta = f_y / deriv;
                let max_step = y * 0.25;
                if delta.abs() > max_step {
                    delta = delta.signum() * max_step;
                }
                y -= delta;
            }

            // Enforce feasibility constraints after each step
            if y <= 0.0 { y = 1e-12; }
            if y >= r_out { y = r_out * 0.95; }

            f_y = f(y)?;
        }

        // --- 6. Final Validation and Fallback ---
        if y < 0.0 { return Ok(U256::ZERO); }
        if y >= r_out { return Err(MathError::InsufficientLiquidity); }

        // Final invariant check to ensure convergence was accurate
        let diff = f(y)?.abs();
        if diff > tol * 100.0 { // If error is still large
            // Fallback to a haircut constant product as a safety net
            let fallback = (amount_in_f64 * r_out) / (r_in + amount_in_f64);
            y = fallback * 0.98; // Apply a 2% haircut
        }

        Ok(self.to_u256(y))
    }

    /// @notice Calculates the radius (or liquidity) of a tick from its reserves.
    pub fn calculateRadius(&self, reserves: Vec<U256>) -> Result<U256, MathError> {
        let sum_squares_f64: f64 = reserves
            .iter()
            .map(|&r| self.to_f64(r).powi(2))
            .sum();
        Ok(self.to_u256(sum_squares_f64.sqrt()))
    }

    /// @notice Calculates the `s` value for a boundary tick.
    pub fn calculateBoundaryTickS(&self, r: U256, k: U256) -> Result<U256, MathError> {
        let r_f64 = self.to_f64(r);
        let k_f64 = self.to_f64(k);
        let r_over_sqrt_n = r_f64 / SQRT5;
        let diff_squared = (k_f64 - r_over_sqrt_n).powi(2);
        let r_squared = r_f64.powi(2);

        if r_squared <= diff_squared { return Ok(U256::ZERO); }
        Ok(self.to_u256((r_squared - diff_squared).sqrt()))
    }
}

// ===================================================================
//
//                 PRIVATE HELPERS AND MATH LOGIC
//
// ===================================================================

impl OrbitalMathHelper {
    /// Computes the torus invariant for a given state.
    fn _computeTorusInvariant(
        &self,
        consolidated_data: &ConsolidatedDataF64,
        total_reserves: &[f64],
    ) -> Result<f64, MathError> {
        // Term 1: ((1/√n * Σ(x_int,i)) - k_bound - r_int * √n)²
        let term1_sum = (consolidated_data.sum_interior_reserves / SQRT5)
            - consolidated_data.boundary_total_k_bound
            - (consolidated_data.interior_consolidated_radius * SQRT5);
        let term1 = if term1_sum > 0.0 { term1_sum.powi(2) } else { 0.0 };

        // Term 2: (√(Σ(x_total,i)² - (1/n)(Σ(x_total,i))²) - r_bound)²
        let sum_total_reserves: f64 = total_reserves.iter().sum();
        let sum_total_reserves_squared: f64 = total_reserves.iter().map(|&r| r.powi(2)).sum();
        let sum_sq_div_n = sum_total_reserves.powi(2) / (TOKENS_COUNT as f64);

        let inner_sqrt_val = sum_total_reserves_squared - sum_sq_div_n;
        if inner_sqrt_val < -1e-9 { return Err(MathError::NegativeSqrt); }
        let sqrt_term = if inner_sqrt_val <= 0.0 { 0.0 } else { inner_sqrt_val.sqrt() };

        let term2_component = sqrt_term - consolidated_data.boundary_consolidated_radius;
        let term2 = if term2_component > 0.0 {
            term2_component.powi(2)
        } else {
            0.0
        };

        Ok(term1 + term2)
    }

    /// Converts the Solidity-native ConsolidatedData struct (U256) to its f64 representation.
    fn to_consolidated_f64(&self, data: ConsolidatedData) -> ConsolidatedDataF64 {
        ConsolidatedDataF64 {
            sum_interior_reserves: self.to_f64(data.sum_interior_reserves),
            interior_consolidated_radius: self.to_f64(data.interior_consolidated_radius),
            boundary_consolidated_radius: self.to_f64(data.boundary_consolidated_radius),
            boundary_total_k_bound: self.to_f64(data.boundary_total_k_bound),
        }
    }

    /// Converts a U256 value to f64, scaling down by the PRECISION factor.
    fn to_f64(&self, value: U256) -> f64 {
        value.to::<f64>() / PRECISION
    }

    /// Converts an f64 value back to U256, scaling up by the PRECISION factor.
    fn to_u256(&self, value: f64) -> U256 {
        U256::from((value * PRECISION).round() as u128)
    }
}
