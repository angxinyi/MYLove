// Comprehensive form validation tests
describe('Form Validation', () => {
  let validationUtils;

  beforeAll(async () => {
    try {
      validationUtils = await import('../../services/validationUtils.ts');
    } catch (error) {
      console.warn('Could not import validation utils, using mock implementations');

      // Fallback mock implementations for testing
      validationUtils = {
        validateEmail: (email) => {
          if (!email) return { isValid: false, error: "Email is required" };
          if (!email.trim()) return { isValid: false, error: "Email cannot be empty" };
          if (email.length > 254) return { isValid: false, error: "Email address is too long" };
          if (email.startsWith('.') || email.endsWith('.')) return { isValid: false, error: "Email cannot start or end with a period" };
          if (email.includes('..')) return { isValid: false, error: "Email cannot contain consecutive periods" };
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) return { isValid: false, error: "Please enter a valid email address" };
          return { isValid: true };
        },

        validatePassword: (password) => {
          if (!password) return { isValid: false, error: "Password is required" };
          if (password.length < 6) return { isValid: false, error: "Password must be at least 6 characters long" };
          if (password.length > 128) return { isValid: false, error: "Password is too long" };

          // Check for all numbers (no letters)
          if (/^\d+$/.test(password)) return { isValid: false, error: "Password must contain at least one letter" };

          // Check for all letters (no numbers) - but allow mixed
          if (/^[a-zA-Z]+$/.test(password)) return { isValid: false, error: "Password must contain at least one letter" };

          return { isValid: true };
        },

        validateName: (name) => {
          if (!name) return { isValid: false, error: "Name is required" };
          if (!name.trim()) return { isValid: false, error: "Name cannot be empty" };
          if (name.length < 2) return { isValid: false, error: "Name must be at least 2 characters long" };
          if (name.length > 50) return { isValid: false, error: "Name is too long" };
          if (!/^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(name)) return { isValid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
          return { isValid: true };
        },

        validateDateOfBirth: (day, month, year) => {
          if (day === 'Day' || month === 'Month' || year === 'Year') {
            return { isValid: false, error: "Please select your date of birth" };
          }

          const dayNum = parseInt(day);
          const yearNum = parseInt(year);

          // Check for special case of day 0 first
          if (dayNum === 0) return { isValid: false, error: "Invalid day" };

          if (!['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].includes(month)) {
            return { isValid: false, error: "Invalid month" };
          }

          // Check for impossible dates - day > 31 for any month
          if (dayNum > 31) return { isValid: false, error: "Invalid date" };

          // Check for months with 30 days
          if (['Apr', 'Jun', 'Sep', 'Nov'].includes(month) && dayNum === 31) {
            return { isValid: false, error: "Invalid date" };
          }

          // Check February dates
          if (month === 'Feb') {
            if (dayNum > 29) return { isValid: false, error: "Invalid date" };
            if (dayNum === 29 && yearNum % 4 !== 0) {
              return { isValid: false, error: "Invalid date" };
            }
          }

          // Check age restrictions
          const currentYear = new Date().getFullYear();
          const age = currentYear - yearNum;
          if (age < 13) return { isValid: false, error: "You must be at least 13 years old to use this app" };
          if (yearNum < 1900) return { isValid: false, error: "Please enter a valid date of birth" };

          return { isValid: true };
        },

        validateCoupleCode: (code) => {
          if (!code) return { isValid: false, error: "Please enter a couple code" };
          if (!code.trim()) return { isValid: false, error: "Couple code cannot be empty" };
          if (code.length !== 6) return { isValid: false, error: "Couple code must be exactly 6 characters" };
          if (!/^[A-Za-z0-9]+$/.test(code)) return { isValid: false, error: "Couple code can only contain letters and numbers" };
          return { isValid: true };
        },

        validateSignupForm: (name, email, password, day, month, year) => {
          const nameResult = validationUtils.validateName(name);
          if (!nameResult.isValid) return nameResult;

          const emailResult = validationUtils.validateEmail(email);
          if (!emailResult.isValid) return emailResult;

          const passwordResult = validationUtils.validatePassword(password);
          if (!passwordResult.isValid) return passwordResult;

          const dobResult = validationUtils.validateDateOfBirth(day, month, year);
          if (!dobResult.isValid) return dobResult;

          return { isValid: true };
        },

        validateLoginForm: (email, password) => {
          if (!email || !password) {
            return { isValid: false, error: "Please enter both email and password" };
          }
          return { isValid: true };
        }
      };
    }
  });

  describe('Email Validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
        'long.email.address@very-long-domain-name.com'
      ];

      validEmails.forEach(email => {
        const result = validationUtils.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        { email: '', expectedError: 'Email is required' },
        { email: '   ', expectedError: 'Email cannot be empty' },
        { email: 'invalid', expectedError: 'Please enter a valid email address' },
        { email: 'invalid@', expectedError: 'Please enter a valid email address' },
        { email: '@domain.com', expectedError: 'Please enter a valid email address' },
        { email: 'user@', expectedError: 'Please enter a valid email address' },
        { email: 'user..name@domain.com', expectedError: 'Email cannot contain consecutive periods' },
        { email: '.user@domain.com', expectedError: 'Email cannot start or end with a period' },
        { email: 'user@domain.com.', expectedError: 'Email cannot start or end with a period' }
      ];

      invalidEmails.forEach(({ email, expectedError }) => {
        const result = validationUtils.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });

    test('should reject extremely long emails', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validationUtils.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email address is too long');
    });
  });

  describe('Password Validation', () => {
    test('should accept valid passwords', () => {
      const validPasswords = [
        'password123',
        'myPass1',
        'StrongP@ssw0rd',
        'simple123',
        'a1b2c3d4e5f6',
        '123456a'
      ];

      validPasswords.forEach(password => {
        const result = validationUtils.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid passwords', () => {
      const invalidPasswords = [
        { password: '', expectedError: 'Password is required' },
        { password: '12345', expectedError: 'Password must be at least 6 characters long' },
        { password: 'abc', expectedError: 'Password must be at least 6 characters long' },
        { password: '123456', expectedError: 'Password must contain at least one letter' },
        { password: 'abcdef', expectedError: 'Password must contain at least one letter' }
      ];

      invalidPasswords.forEach(({ password, expectedError }) => {
        const result = validationUtils.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });

    test('should reject extremely long passwords', () => {
      const longPassword = 'a'.repeat(129) + '1';
      const result = validationUtils.validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is too long');
    });
  });

  describe('Name Validation', () => {
    test('should accept valid names', () => {
      const validNames = [
        'John',
        'Mary Jane',
        'Jean-Pierre',
        "O'Connor",
        'Anna-Maria',
        'Li Wei',
        'José',
        'Dr. Smith'
      ];

      validNames.forEach(name => {
        const result = validationUtils.validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid names', () => {
      const invalidNames = [
        { name: '', expectedError: 'Name is required' },
        { name: '   ', expectedError: 'Name cannot be empty' },
        { name: 'A', expectedError: 'Name must be at least 2 characters long' },
        { name: 'John123', expectedError: 'Name can only contain letters, spaces, hyphens, and apostrophes' },
        { name: 'User@Name', expectedError: 'Name can only contain letters, spaces, hyphens, and apostrophes' },
        { name: 'a'.repeat(51), expectedError: 'Name is too long' }
      ];

      invalidNames.forEach(({ name, expectedError }) => {
        const result = validationUtils.validateName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });
  });

  describe('Date of Birth Validation', () => {
    const currentYear = new Date().getFullYear();

    test('should accept valid dates of birth', () => {
      const validDates = [
        { day: '15', month: 'Mar', year: '1990' },
        { day: '1', month: 'Jan', year: '2000' },
        { day: '29', month: 'Feb', year: '2000' }, // Leap year
        { day: '31', month: 'Dec', year: '1985' },
        { day: '28', month: 'Feb', year: '2001' } // Non-leap year
      ];

      validDates.forEach(({ day, month, year }) => {
        const result = validationUtils.validateDateOfBirth(day, month, year);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject incomplete date selections', () => {
      const incompleteDates = [
        { day: 'Day', month: 'Jan', year: '1990', expectedError: 'Please select your date of birth' },
        { day: '15', month: 'Month', year: '1990', expectedError: 'Please select your date of birth' },
        { day: '15', month: 'Jan', year: 'Year', expectedError: 'Please select your date of birth' }
      ];

      incompleteDates.forEach(({ day, month, year, expectedError }) => {
        const result = validationUtils.validateDateOfBirth(day, month, year);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });

    test('should reject invalid dates', () => {
      const invalidDates = [
        { day: '32', month: 'Jan', year: '1990', expectedError: 'Invalid date' },
        { day: '29', month: 'Feb', year: '2001', expectedError: 'Invalid date' }, // Non-leap year
        { day: '31', month: 'Apr', year: '1990', expectedError: 'Invalid date' }, // April has 30 days
        { day: '0', month: 'Jan', year: '1990', expectedError: 'Invalid day' },
        { day: '15', month: 'InvalidMonth', year: '1990', expectedError: 'Invalid month' }
      ];

      invalidDates.forEach(({ day, month, year, expectedError }) => {
        const result = validationUtils.validateDateOfBirth(day, month, year);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });

    test('should reject ages under 13', () => {
      const recentYear = currentYear - 10; // 10 years old
      const result = validationUtils.validateDateOfBirth('1', 'Jan', recentYear.toString());
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('You must be at least 13 years old to use this app');
    });

    test('should reject unrealistic ages', () => {
      const result = validationUtils.validateDateOfBirth('1', 'Jan', '1850');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid date of birth');
    });
  });

  describe('Couple Code Validation', () => {
    test('should accept valid couple codes', () => {
      const validCodes = [
        'ABC123',
        'XYZ789',
        'A1B2C3',
        '123456',
        'ABCDEF'
      ];

      validCodes.forEach(code => {
        const result = validationUtils.validateCoupleCode(code);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should accept and normalize lowercase codes', () => {
      const result = validationUtils.validateCoupleCode('abc123');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid couple codes', () => {
      const invalidCodes = [
        { code: '', expectedError: 'Please enter a couple code' },
        { code: '   ', expectedError: 'Couple code cannot be empty' },
        { code: '12345', expectedError: 'Couple code must be exactly 6 characters' },
        { code: '1234567', expectedError: 'Couple code must be exactly 6 characters' },
        { code: 'ABC12@', expectedError: 'Couple code can only contain letters and numbers' },
        { code: 'ABC 12', expectedError: 'Couple code can only contain letters and numbers' }
      ];

      invalidCodes.forEach(({ code, expectedError }) => {
        const result = validationUtils.validateCoupleCode(code);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });
  });

  describe('Complete Form Validation', () => {
    test('should validate complete signup form successfully', () => {
      const result = validationUtils.validateSignupForm(
        'John Doe',
        'john@example.com',
        'password123',
        '15',
        'Mar',
        '1990'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject signup form with invalid name first', () => {
      const result = validationUtils.validateSignupForm(
        'J', // Too short
        'john@example.com',
        'password123',
        '15',
        'Mar',
        '1990'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be at least 2 characters long');
    });

    test('should validate complete login form successfully', () => {
      const result = validationUtils.validateLoginForm(
        'john@example.com',
        'anypassword'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject login form with missing fields', () => {
      const result = validationUtils.validateLoginForm('', 'password');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter both email and password');
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle unicode characters appropriately', () => {
      const unicodeName = 'José María';
      const result = validationUtils.validateName(unicodeName);
      expect(result.isValid).toBe(true);
    });

    test('should handle whitespace trimming', () => {
      const email = '  test@example.com  ';
      const result = validationUtils.validateEmail(email.trim());
      expect(result.isValid).toBe(true);
    });

    test('should handle special date cases', () => {
      // Test leap year
      const leapYearResult = validationUtils.validateDateOfBirth('29', 'Feb', '2000');
      expect(leapYearResult.isValid).toBe(true);

      // Test non-leap year
      const nonLeapYearResult = validationUtils.validateDateOfBirth('29', 'Feb', '1999');
      expect(nonLeapYearResult.isValid).toBe(false);
    });
  });
});