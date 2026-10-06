const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(form) {
  if (!form.name?.trim()) return 'Name is required';
  if (!emailPattern.test(form.email?.trim() || '')) return 'Enter a valid email';
  if (!form.studentId?.trim()) return 'Student ID is required';
  if ((form.password || '').length < 6) return 'Password must be at least 6 characters';
  if (form.password !== form.confirmPassword) return 'Passwords do not match';
  return '';
}

export function validateLogin(form) {
  if (!emailPattern.test(form.email?.trim() || '')) return 'Enter a valid email';
  if (!form.password) return 'Password is required';
  return '';
}

export function validateItem(form) {
  if (!form.title?.trim()) return 'Item title is required';
  if (!form.description?.trim()) return 'Description is required';
  if (!form.category?.trim()) return 'Category is required';
  if (!form.location?.trim()) return 'Location is required';
  if (!form.date || Number.isNaN(Date.parse(form.date))) return 'Enter a valid date';
  if (!['Lost', 'Found'].includes(form.type)) return 'Choose Lost or Found';
  if (form.image?.trim()) {
    try {
      const imageUrl = new URL(form.image);
      if (!['http:', 'https:'].includes(imageUrl.protocol)) return 'Image must be a valid URL';
    } catch {
      return 'Image must be a valid URL';
    }
  }
  return '';
}

export function validateClaim(form) {
  if (!form.message?.trim()) return 'Message is required';
  if (!form.proofDescription?.trim()) return 'Proof description is required';
  return '';
}