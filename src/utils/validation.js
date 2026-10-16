export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateSignupForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!validateEmail(email)) errors.email = 'Please enter a valid email address';
  if (!validatePassword(password)) errors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!validateEmail(email)) errors.email = 'Please enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateEntry({ title, content }) {
  const errors = {};
  if (!title || !title.trim()) errors.title = 'Title is required';
  if (title && title.length > 200) errors.title = 'Title must be under 200 characters';
  if (!content || !content.trim()) errors.content = 'Content is required';
  return errors;
}

export function validateMoodPercentages(percentages) {
  const total = Object.values(percentages).reduce((sum, v) => sum + (v || 0), 0);
  return { total, isValid: total === 100 };
}

export function validatePhotoFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 4 * 1024 * 1024;
  const errors = [];

  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPG, PNG, and WebP files are supported');
  }
  if (file.size > maxSize) {
    errors.push('File size must be under 4MB');
  }
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
