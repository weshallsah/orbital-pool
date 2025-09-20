#![cfg_attr(not(feature = "export-abi"), no_main)]
#![allow(non_snake_case)] // Allows camelCase function names to match Solidity.

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;

use alloy_primitives::aliases::U144;
/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::U256, prelude::*, storage::StorageU256};

// Define some persistent storage using the Solidity ABI.
// Counter will be the entrypoint.
#[storage]
#[entrypoint]
pub struct OrbitalHelper {
    /// A number stored in contract storage.
    _placeholder: StorageU256,
}
/// Declare that OrbitalHelper is a contract with the following external methods.
#[public]
impl OrbitalHelper {
    // implement arithemtic operations for Q96X48 format and then use that for all further calculations.
    fn convert_to_Q96X48(value: U144) -> U144 {
        value << 48
    }
    fn convert_from_Q96X48(value: U144) -> U144 {
        value >> 48
    }
    fn add_Q96X48(a: U144, b: U144) -> U144 {
        a + b
    }
    fn sub_Q96X48(a: U144, b: U144) -> U144 {
        a - b
    }
    fn mul_Q96X48(a: U144, b: U144) -> U144 {
        // (a * b) >> 48
        let product: U256 = U256::from(a) * U256::from(b);
        let shifted: U256 = product >> 48;
        // Check if the result fits in U144 (2^144 - 1)
        let max_u144 = (U256::from(1u128) << 144) - U256::from(1u128);
        assert!(shifted <= max_u144, "Overflow in Q96X48 multiplication");
        // Convert U256 to U144 by taking the lower 144 bits
        // U144 is represented internally as [u64; 3], so we take the first 2.25 u64s
        let limbs = shifted.as_limbs();
        let low = limbs[0];
        let mid = limbs[1];
        let high = limbs[2] & 0xFFFF; // Only take lower 16 bits of the third limb (144 - 128 = 16)
        U144::from_limbs([low, mid, high])
    }

    fn div_Q96X48(a: U144, b: U144) -> U144 {
        // (a << 48) / b
        assert!(b != U144::ZERO, "Division by zero");
        let dividend: U256 = U256::from(a) << 48;
        let result: U256 = dividend / U256::from(b);
        // Check if the result fits in U144 (2^144 - 1)
        let max_u144 = (U256::from(1u128) << 144) - U256::from(1u128);
        assert!(result <= max_u144, "Overflow in Q96X48 division");
        // Convert U256 to U144 by taking the lower 144 bits
        // U144 is represented internally as [u64; 3], so we take the first 2.25 u64s
        let limbs = result.as_limbs();
        let low = limbs[0];
        let mid = limbs[1];
        let high = limbs[2] & 0xFFFF; // Only take lower 16 bits of the third limb (144 - 128 = 16)
        U144::from_limbs([low, mid, high])
    }

    // Square root function for Q96X48 format using Newton's method
    // This function maintains the Q96.48 fixed-point precision
    fn sqrt_Q96X48(x: U144) -> U144 {
        if x == U144::ZERO {
            return U144::ZERO;
        }

        // Convert to U256 for intermediate calculations
        let x_256 = U256::from(x);

        // For Q96.48 format: sqrt(x) where x is in Q96.48
        // The result should also be in Q96.48 format
        // We need to shift left by 48 bits to get the full precision
        // sqrt(a * 2^48) = sqrt(a) * 2^24, but we want the result in Q96.48
        // So we shift by 24 bits to maintain Q96.48 format
        let shifted_x = x_256 << 24;

        // Find the most significant bit for better initial guess
        let msb = 255 - x_256.leading_zeros();
        let mut guess = U256::from(1u128) << ((msb + 24) >> 1);

        // Newton's method: guess = (guess + shifted_x/guess) / 2
        // Iterate for precision (7 iterations should be sufficient for 256-bit precision)
        for _ in 0..7 {
            let prev_guess = guess;
            guess = (guess + shifted_x / guess) >> 1;

            // Check for convergence (when guess stops changing)
            if guess == prev_guess {
                break;
            }
        }

        // Convert back to U144, ensuring it fits
        let max_u144 = (U256::from(1u128) << 144) - U256::from(1u128);
        assert!(guess <= max_u144, "Overflow in Q96X48 square root");

        let limbs = guess.as_limbs();
        let low = limbs[0];
        let mid = limbs[1];
        let high = limbs[2] & 0xFFFF;
        U144::from_limbs([low, mid, high])
    }

    // calculate radius from reserves and n
    fn calculate_radius(reserve: U144) -> U144 {
        let root5 = U144::from(629397181890196u128);
        let one = Self::convert_to_Q96X48(U144::from(1));
        let denominator = Self::sub_Q96X48(one, Self::div_Q96X48(one, root5));
        return Self::convert_from_Q96X48(Self::div_Q96X48(
            Self::convert_to_Q96X48(reserve),
            denominator,
        ));
    }
    // calculate k from p and r using the formula: k = r√n - r(p+n-1)/√(n(p²+n-1))
    fn calculateK(depeg_limit: U144, radius: U144) -> U144 {
        // Note: assuming n = 5 based on the context (golden ratio calculations)
        let n = Self::convert_to_Q96X48(U144::from(5));
        let one = Self::convert_to_Q96X48(U144::from(1));

        // Calculate √n
        let sqrt_n = Self::sqrt_Q96X48(n);

        // Calculate first term: r√n
        let first_term = Self::mul_Q96X48(radius, sqrt_n);

        // Calculate p² (depeg_limit is already in Q96X48 format)
        let p_squared = Self::mul_Q96X48(depeg_limit, depeg_limit);

        // Calculate p + n - 1
        let p_plus_n_minus_1 = Self::sub_Q96X48(Self::add_Q96X48(depeg_limit, n), one);

        // Calculate p² + n - 1
        let p_squared_plus_n_minus_1 = Self::sub_Q96X48(Self::add_Q96X48(p_squared, n), one);

        // Calculate n(p² + n - 1)
        let n_times_expr = Self::mul_Q96X48(n, p_squared_plus_n_minus_1);

        // Calculate √(n(p² + n - 1))
        let sqrt_denominator = Self::sqrt_Q96X48(n_times_expr);

        // Calculate r(p + n - 1)
        let numerator_second_term = Self::mul_Q96X48(radius, p_plus_n_minus_1);

        // Calculate second term: r(p + n - 1) / √(n(p² + n - 1))
        let second_term = Self::div_Q96X48(numerator_second_term, sqrt_denominator);

        // Calculate final result: r√n - r(p + n - 1) / √(n(p² + n - 1))
        Self::sub_Q96X48(first_term, second_term)
    }
    // return k and r together

    // Public interface function for square root calculation
    // This function can be called from Solidity contracts
    pub fn sqrt_fixed_point(x: U256) -> U256 {
        // Convert U256 to U144 for internal calculation
        let x_u144 = U144::from_limbs([x.as_limbs()[0], x.as_limbs()[1], x.as_limbs()[2] & 0xFFFF]);
        let result = Self::sqrt_Q96X48(x_u144);

        // Convert back to U256
        let result_limbs = result.as_limbs();
        U256::from_limbs([result_limbs[0], result_limbs[1], result_limbs[2], 0])
    }

    // Alternative square root implementation using binary search method
    // This can be used as a fallback or for comparison
    fn sqrt_binary_search_Q96X48(x: U144) -> U144 {
        if x == U144::ZERO {
            return U144::ZERO;
        }

        let x_256 = U256::from(x);
        let shifted_x = x_256 << 24; // Maintain Q96.48 precision

        // Binary search for square root
        let mut left = U256::from(1u128);
        let mut right = shifted_x;

        while left <= right {
            let mid = (left + right) >> 1;
            let square = mid * mid;

            if square == shifted_x {
                // Found exact match
                let max_u144 = (U256::from(1u128) << 144) - U256::from(1u128);
                assert!(mid <= max_u144, "Overflow in binary search square root");

                let limbs = mid.as_limbs();
                return U144::from_limbs([limbs[0], limbs[1], limbs[2] & 0xFFFF]);
            } else if square < shifted_x {
                left = mid + U256::from(1u128);
            } else {
                right = mid - U256::from(1u128);
            }
        }

        // Return the floor of the square root
        let max_u144 = (U256::from(1u128) << 144) - U256::from(1u128);
        assert!(right <= max_u144, "Overflow in binary search square root");

        let limbs = right.as_limbs();
        U144::from_limbs([limbs[0], limbs[1], limbs[2] & 0xFFFF])
    }
}
