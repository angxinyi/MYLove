// Form validation utilities for the love language app

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  if (!email.trim()) {
    return { isValid: false, error: "Email cannot be empty" };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  // Check for common issues
  if (email.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  if (email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: "Email cannot start or end with a period" };
  }

  if (email.includes('..')) {
    return { isValid: false, error: "Email cannot contain consecutive periods" };
  }

  return { isValid: true };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long" };
  }

  if (password.length > 128) {
    return { isValid: false, error: "Password is too long" };
  }

  // Check for at least one letter and one number (optional - strengthen as needed)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter) {
    return { isValid: false, error: "Password must contain at least one letter" };
  }

  return { isValid: true };
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: "Name is required" };
  }

  if (!name.trim()) {
    return { isValid: false, error: "Name cannot be empty" };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long" };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: "Name is too long" };
  }

  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }

  return { isValid: true };
}

// Date of birth validation
export function validateDateOfBirth(day: string, month: string, year: string): ValidationResult {
  if (day === "Day" || month === "Month" || year === "Year") {
    return { isValid: false, error: "Please select your date of birth" };
  }

  const dayNum = parseInt(day);
  const yearNum = parseInt(year);

  // Validate ranges
  if (dayNum < 1 || dayNum > 31) {
    return { isValid: false, error: "Invalid day" };
  }

  if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
    return { isValid: false, error: "Invalid year" };
  }

  // Convert month to index
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = months.indexOf(month);

  if (monthIndex === -1) {
    return { isValid: false, error: "Invalid month" };
  }

  // Create date object to validate
  const date = new Date(yearNum, monthIndex, dayNum);

  // Check if date is valid (handles things like Feb 30, Apr 31)
  if (date.getDate() !== dayNum || date.getMonth() !== monthIndex || date.getFullYear() !== yearNum) {
    return { isValid: false, error: "Invalid date" };
  }

  // Check if user is at least 13 years old (common app requirement)
  const today = new Date();
  const age = today.getFullYear() - yearNum;
  const monthDiff = today.getMonth() - monthIndex;
  const dayDiff = today.getDate() - dayNum;

  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

  if (actualAge < 13) {
    return { isValid: false, error: "You must be at least 13 years old to use this app" };
  }

  if (actualAge > 120) {
    return { isValid: false, error: "Please enter a valid date of birth" };
  }

  return { isValid: true };
}

// Signup form validation (combines all validations)
export function validateSignupForm(name: string, email: string, password: string, day: string, month: string, year: string): ValidationResult {
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  const dobValidation = validateDateOfBirth(day, month, year);
  if (!dobValidation.isValid) {
    return dobValidation;
  }

  return { isValid: true };
}

// Login form validation
export function validateLoginForm(email: string, password: string): ValidationResult {
  if (!email || !password) {
    return { isValid: false, error: "Please enter both email and password" };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  // For login, we don't need strict password validation since it's already set
  if (!password.trim()) {
    return { isValid: false, error: "Password cannot be empty" };
  }

  return { isValid: true };
}

// Couple code validation
export function validateCoupleCode(code: string): ValidationResult {
  if (!code) {
    return { isValid: false, error: "Please enter a couple code" };
  }

  if (!code.trim()) {
    return { isValid: false, error: "Couple code cannot be empty" };
  }

  const trimmedCode = code.trim().toUpperCase();

  if (trimmedCode.length !== 6) {
    return { isValid: false, error: "Couple code must be exactly 6 characters" };
  }

  // Check format (letters and numbers only)
  const codeRegex = /^[A-Z0-9]{6}$/;
  if (!codeRegex.test(trimmedCode)) {
    return { isValid: false, error: "Couple code can only contain letters and numbers" };
  }

  return { isValid: true };
}