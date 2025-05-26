// Check if [data-input-mm], [data-input-inch], [data-input-inch-fraction] is a valid number or not depending on the measurement mode
export function isLengthMeasurementNonZero(mm, inch, eighthInch, is_cm_mode){
	if(is_cm_mode){
		const num = Number(mm);
		return typeof num === 'number' && !isNaN(num) && num > 0;
	}
	
	if(inch == ""){
		inch = 0;
	}
	
	const inch_final = Number(inch);
	const eighthInch_final = Number(eighthInch);
	const total_inches = inch_final * 8 + eighthInch_final;
	
	return typeof inch_final === 'number' && !isNaN(inch_final) && typeof eighthInch_final === 'number' && !isNaN(eighthInch_final) && total_inches > 0;
}

// Get the px amount from entries in [data-input-cm], [data-input-inch], [data-input-inch-fraction]
export function getPxMeasurementFromCmAndInches(cm, inch, eighthInch, is_cm_mode, pxPerCm, pxPerEighthIn){
	const inches_adjusted = (inch == "")? 0 : Number(inch);
	return (is_cm_mode)? pxPerCm * Number(cm) : pxPerEighthIn * (inches_adjusted * 8 + Number(eighthInch));

}

//Get the px amount from entries in [data-input-mm], [data-input-inch], [data-input-inch-fraction]
export function getPxMeasurementFromMmAndInches(mm, inch, eighthInch, is_cm_mode, pxPerCm, pxPerEighthIn){
	const inches_adjusted = (inch == "")? 0 : Number(inch);
	return (is_cm_mode)? pxPerCm * Number(mm / 10) : pxPerEighthIn * (inches_adjusted * 8 + Number(eighthInch));
}

// Returns unrounded value of meters squared
export function convertPxAreaToMetersSquared(pxSquared, pxPerCm){
	const pxSquaredPerCmSquared = Math.pow(pxPerCm, 2);
	const m_squared = pxSquared / pxSquaredPerCmSquared / 10000;
	return m_squared;
}

// Returns unrounded value of feet squared
export function convertPxAreaToFeetSquared(pxSquared, pxPerEighthIn){
	const px_per_inch = pxPerEighthIn * 8;
	const ps_squared_per_inches_squared = Math.pow(px_per_inch, 2);
	const feet_squared = pxSquared / ps_squared_per_inches_squared / 144;
	return feet_squared;
}
