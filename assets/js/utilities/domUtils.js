// Returns the first element found or null
export function $(selector){
	return document.querySelector(selector);
}

// Returns all elements found or null
export function all(selector){
	return document.querySelectorAll(selector);
}

// Opens error modal
export function error(message){
	const errorModal = new bootstrap.Modal(document.getElementById('error_modal'));
	document.getElementById('error_modal_message').innerHTML = message;
	errorModal.show();
}

//Opens success modal
export function success(message){
	const successModal = new bootstrap.Modal(document.getElementById('success_modal'));
	document.getElementById('success_modal_message').innerHTML = message;
	successModal.show();
}

// Opens a modal
export function modal(id){
	const modal = new bootstrap.Modal(document.getElementById(id));
	modal.show();
}