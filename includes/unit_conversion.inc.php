<?php 
	// =========================================================================
	// Refactored from Unit Calculation Functions in Services/SuiteRenderer.js
	// =========================================================================
	function convertPxToInchLabel($px, $pxPerEighthIn)
	{
		// Calculate how many "eighth of inches"
		$eighth_of_inches = $px / $pxPerEighthIn;
		$inches = floor($eighth_of_inches / 8);
		$remainder = round($eighth_of_inches - $inches * 8);
	
		// Handle edge case: remainder == 8
		if ($remainder == 8) {
			$inches++;
			$remainder = 0;
		}
	
		$numerator = 0;
		$denominator = 0;
	
		switch ($remainder) {
			case 1:
				$numerator = 1;
				$denominator = 8;
				break;
			case 2:
				$numerator = 1;
				$denominator = 4;
				break;
			case 3:
				$numerator = 3;
				$denominator = 8;
				break;
			case 4:
				$numerator = 1;
				$denominator = 2;
				break;
			case 5:
				$numerator = 5;
				$denominator = 8;
				break;
			case 6:
				$numerator = 3;
				$denominator = 4;
				break;
			case 7:
				$numerator = 7;
				$denominator = 8;
				break;
			default:
				// remainder = 0, or unexpected
				$numerator = $remainder;
				$denominator = 8;
				break;
		}
	
		// Convert inches to feet if needed
		if ($inches >= 12) {
			$feet = floor($inches / 12);
			$remainder_inches = round($inches - $feet * 12);
	
			if ($remainder_inches == 0) {
				// If no inch remainder
				return ($remainder == 0)
				? $feet . "'"
						: $feet . "' " . $numerator . '/' . $denominator . '"';
			} else {
				// If we do have inch remainder
				return ($remainder == 0)
				? $feet . "' " . $remainder_inches . '"'
						: $feet . "' " . $remainder_inches . ' ' . $numerator . '/' . $denominator . '"';
			}
		}
	
		// Return inches (and fraction if needed)
		return ($remainder == 0)
		? $inches . '"'
				: $inches . ' ' . $numerator . '/' . $denominator . '"';
	}
	
	function convertPxToMLabel($px, $pxPerCm)
	{
		return round($px / $pxPerCm / 100) . "m";
	}
	
	function convertPxToCmLabel($px, $pxPerCm)
	{
		return round($px / $pxPerCm) . "cm";
	}
	
	function convertPxToMmLabel($px, $pxPerCm)
	{
		return round($px / $pxPerCm * 10) . "mm";
	}
	
	function convertPxToWholeInches($px, $pxPerEighthIn)
	{
		$eighth_of_inches = $px / $pxPerEighthIn;
		return floor($eighth_of_inches / 8);
	}
	
	function convertPxToRemainderEighthInches($px, $pxPerEighthIn)
	{
		$eighth_of_inches = $px / $pxPerEighthIn;
		$inches = floor($eighth_of_inches / 8);
		return round($eighth_of_inches - $inches * 8);
	}
	
	function convertPxToCm($px, $pxPerCm)
	{
		return round($px / $pxPerCm);
	}
	
	function convertPxToMm($px, $pxPerCm)
	{
		return round($px / $pxPerCm * 10);
	}
	
	// =========================================================================
	// Refactored from Unit Calculation Functions in Utilities/measurementUtils.js
	// =========================================================================
	
	// Returns unrounded value of meters squared
	function convertPxAreaToMetersSquared($pxSquared, $pxPerCm)
	{
		$pxSquaredPerCmSquared = pow($pxPerCm, 2);
		// 1 cm^2 = 1e-4 m^2
		$m_squared = $pxSquared / $pxSquaredPerCmSquared / 10000;
		return $m_squared;
	}
	
	// Returns unrounded value of feet squared
	function convertPxAreaToFeetSquared($pxSquared, $pxPerEighthIn)
	{
		// 1 inch = 8 * pxPerEighthIn
		$px_per_inch = $pxPerEighthIn * 8;
		$pxSquaredPerInchSquared = pow($px_per_inch, 2);
		// 1 ft^2 = 144 in^2
		$feet_squared = $pxSquared / $pxSquaredPerInchSquared / 144;
		return $feet_squared;
	}
?>