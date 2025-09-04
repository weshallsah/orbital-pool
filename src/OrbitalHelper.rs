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
#[derive(Sol, Clone, Default)]
pub struct ConsolidatedData {
    sum_interior_reserves: U256,
    interior_consolidated_radius: U256,
    boundary_consolidated_radius: U256,
    boundary_total_k_bound: U256,
}

/// Internal struct for holding f64 versions of the consolidated data.
#[derive(Clone, Default)]
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
    /// @dev Implements the full torus invariant from the Orbital AMM whitepaper.
    ///      Uses Newton's method with numerical differentiation to find the root.
    /// @param consolidated_data Pre-calculated consolidated data from the main Solidity contract.
    /// @param total_reserves The current total reserves of all tokens before the swap.
    /// @param token_in_index The index of the input token.
    /// @param token_out_index The index of the output token.
    /// @param amount_in_after_fee The input amount after deducting fees.
    /// @return The calculated output amount that preserves the invariant.
    pub fn solveTorusInvariant(
        &self,
        consolidated_data: ConsolidatedData,
        total_reserves: Vec<U256>,
        token_in_index: U256,
        token_out_index: U256,
        amount_in_after_fee: U256,
    ) -> Result<U256, MathError> {
        // --- 1. PREPARATION AND CONVERSION ---
        let in_idx = token_in_index.to::<usize>();
        let out_idx = token_out_index.to::<usize>();

        if in_idx >= TOKENS_COUNT || out_idx >= TOKENS_COUNT || total_reserves.len() != TOKENS_COUNT {
            return Err(MathError::InvalidArrayLength);
        }

        let total_reserves_f64: Vec<f64> =
            total_reserves.iter().map(|&r| self.to_f64(r)).collect();
        let amount_in_f64 = self.to_f64(amount_in_after_fee);
        let initial_out_reserve_f64 = total_reserves_f64[out_idx];

        // Convert consolidated data to f64 for calculations
        let consolidated_f64 = self.to_consolidated_f64(consolidated_data);

        // --- 2. CALCULATE INITIAL STATE ---
        let initial_invariant_f64 = self._computeTorusInvariant(&consolidated_f64, &total_reserves_f64)?;

        // --- 3. DEFINE FUNCTIONS FOR NEWTON'S METHOD ---
        // f(y) = new_invariant(y) - initial_invariant = 0
        let f = |y: f64| -> Result<f64, MathError> {
            let mut new_reserves = total_reserves_f64.clone();
            new_reserves[in_idx] += amount_in_f64;
            if new_reserves[out_idx] < y { return Err(MathError::InsufficientLiquidity); }
            new_reserves[out_idx] -= y;
            let new_invariant = self._computeTorusInvariant(&consolidated_f64, &new_reserves)?;
            Ok(new_invariant - initial_invariant_f64)
        };

        // Numerical differentiation: f'(y) ≈ (f(y + ε) - f(y)) / ε
        let f_prime = |y: f64| -> Result<f64, MathError> {
            const EPSILON: f64 = 1e-6;
            let f_y = f(y)?;
            let f_y_plus_epsilon = f(y + EPSILON)?;
            Ok((f_y_plus_epsilon - f_y) / EPSILON)
        };

        // --- 4. EXECUTE NEWTON'S METHOD ---
        let mut amount_out_f64 = 0.0;
        const MAX_ITERATIONS: u8 = 25;

        for i in 0..MAX_ITERATIONS {
            let derivative = f_prime(amount_out_f64)?;
            if derivative.abs() < 1e-9 { 
                if i == 0 { return Err(MathError::ConvergenceError); } // Failed on first step
                break; 
            }
            amount_out_f64 = amount_out_f64 - (f(amount_out_f64)? / derivative);
        }

        // --- 5. VALIDATE AND RETURN RESULT ---
        if amount_out_f64 < 0.0 { amount_out_f64 = 0.0; }
        if amount_out_f64 > initial_out_reserve_f64 { return Err(MathError::InsufficientLiquidity); }

        Ok(self.to_u256(amount_out_f64))
    }

    /// @notice Calculate the radius (or liquidity) of a tick from its reserves.
    /// @dev Implements the formula: r = sqrt(sum(reserves[i]^2))
    /// @param reserves A vector of token reserve amounts.
    /// @return The calculated radius as a U256 value.
    pub fn calculateRadius(&self, reserves: Vec<U256>) -> Result<U256, MathError> {
        let mut sum_squares_f64: f64 = 0.0;
        for reserve in reserves {
            let reserve_f64 = self.to_f64(reserve);
            sum_squares_f64 += reserve_f64.powi(2);
        }
        let radius_f64 = sum_squares_f64.sqrt();
        Ok(self.to_u256(radius_f64))
    }

    /// @notice Calculates the `s` value for a boundary tick: s = sqrt(r² - (k - r/√n)²)
    /// @param r The radius of the tick.
    /// @param k The plane constant of the tick.
    /// @return The calculated `s` value.
    pub fn calculateBoundaryTickS(&self, r: U256, k: U256) -> Result<U256, MathError> {
        let r_f64 = self.to_f64(r);
        let k_f64 = self.to_f64(k);

        let r_over_sqrt_n = r_f64 / SQRT5;
        let diff = (k_f64 - r_over_sqrt_n).abs();
        let r_squared = r_f64.powi(2);
        let diff_squared = diff.powi(2);

        if r_squared <= diff_squared { return Ok(U256::ZERO); }
        let s_f64 = (r_squared - diff_squared).sqrt();
        Ok(self.to_u256(s_f64))
    }
}

// ===================================================================
//
//                 PRIVATE HELPERS AND MATH LOGIC
//
// ===================================================================

impl OrbitalMathHelper {
    /// Computes the torus invariant for a given state of reserves and consolidated tick data.
    fn _computeTorusInvariant(
        &self,
        consolidated_data: &ConsolidatedDataF64,
        total_reserves: &[f64],
    ) -> Result<f64, MathError> {
        // --- 1. CALCULATE TERM 1 of the invariant ---
        // Term 1: ((1/√n * Σ(x_int,i)) - k_bound - r_int * √n)²
        let first_component = consolidated_data.sum_interior_reserves / SQRT5;
        let second_component = consolidated_data.boundary_total_k_bound;
        let third_component = consolidated_data.interior_consolidated_radius * SQRT5;

        let term1_sum = first_component - second_component - third_component;
        let term1 = if term1_sum > 0.0 { term1_sum.powi(2) } else { 0.0 };

        // --- 2. CALCULATE TERM 2 of the invariant ---
        // Term 2: (√(Σ(x_total,i)² - (1/n)(Σ(x_total,i))²) - r_bound)²
        let sum_total_reserves: f64 = total_reserves.iter().sum();
        let sum_total_reserves_squared: f64 = total_reserves.iter().map(|&r| r.powi(2)).sum();
        let sum_sq_div_n = sum_total_reserves.powi(2) / (TOKENS_COUNT as f64);

        let inner_sqrt_val = sum_total_reserves_squared - sum_sq_div_n;
        if inner_sqrt_val < -1e-9 { return Err(MathError::NegativeSqrt); } // Allow for small float inaccuracies
        let sqrt_term = if inner_sqrt_val <= 0.0 { 0.0 } else { inner_sqrt_val.sqrt() };

        let term2_component = sqrt_term - consolidated_data.boundary_consolidated_radius;
        let term2 = if term2_component > 0.0 { term2_component.powi(2) } else { 0.0 };

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

