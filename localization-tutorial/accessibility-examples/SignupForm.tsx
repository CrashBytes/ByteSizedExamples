import React, { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Accessible signup form with localized validation
 * 
 * Features:
 * - WCAG 2.1 Level AA compliant
 * - Localized error messages
 * - ARIA attributes for screen readers
 * - Real-time validation feedback
 * - Keyboard navigation support
 */
export const SignupForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const validateEmail = (email: string): string | undefined => {
    if (!email) return t('forms.errors.required');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t('forms.errors.invalidEmail');
    return undefined;
  };
  
  const validatePassword = (password: string): string | undefined => {
    if (!password) return t('forms.errors.required');
    if (password.length < 8) return t('forms.errors.passwordTooShort');
    return undefined;
  };
  
  const handleBlur = (field: keyof typeof formData) => {
    setTouched({ ...touched, [field]: true });
    
    const newErrors = { ...errors };
    
    if (field === 'email') {
      newErrors.email = validateEmail(formData.email);
    } else if (field === 'password') {
      newErrors.password = validatePassword(formData.password);
    } else if (!formData[field]) {
      newErrors[field] = t('forms.errors.required');
    }
    
    setErrors(newErrors);
  };
  
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (touched[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Validate all fields
    const newErrors: FormErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      firstName: !formData.firstName ? t('forms.errors.required') : undefined,
      lastName: !formData.lastName ? t('forms.errors.required') : undefined
    };
    
    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof FormErrors] === undefined) {
        delete newErrors[key as keyof FormErrors];
      }
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', formData);
    }
    
    setSubmitting(false);
  };
  
  const getAriaDescribedBy = (field: keyof typeof formData): string | undefined => {
    const ids = [];
    
    // Add hint ID if exists
    if (field === 'email' || field === 'password') {
      ids.push(`${field}-hint`);
    }
    
    // Add error ID if error exists
    if (errors[field] && touched[field]) {
      ids.push(`${field}-error`);
    }
    
    return ids.length > 0 ? ids.join(' ') : undefined;
  };
  
  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>{t('forms.signup')}</h2>
      
      {/* Email field */}
      <div className="form-group">
        <label htmlFor="email">
          {t('forms.email.label')}
          <span aria-label={t('forms.email.aria.required')}>*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          aria-required="true"
          aria-invalid={!!(errors.email && touched.email)}
          aria-describedby={getAriaDescribedBy('email')}
          placeholder={t('forms.email.placeholder')}
        />
        <p id="email-hint" className="form-hint">
          {t('forms.email.hint')}
        </p>
        {errors.email && touched.email && (
          <p 
            id="email-error" 
            className="form-error"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span>
            {errors.email}
          </p>
        )}
      </div>
      
      {/* Password field */}
      <div className="form-group">
        <label htmlFor="password">
          {t('forms.password.label')}
          <span aria-label={t('forms.password.aria.required')}>*</span>
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          aria-required="true"
          aria-invalid={!!(errors.password && touched.password)}
          aria-describedby={getAriaDescribedBy('password')}
          placeholder={t('forms.password.placeholder')}
        />
        <p id="password-hint" className="form-hint">
          {t('forms.password.hint')}
        </p>
        {errors.password && touched.password && (
          <p 
            id="password-error" 
            className="form-error"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span>
            {errors.password}
          </p>
        )}
      </div>
      
      {/* First name field */}
      <div className="form-group">
        <label htmlFor="firstName">
          {t('forms.firstName')}
          <span aria-label={t('forms.email.aria.required')}>*</span>
        </label>
        <input
          id="firstName"
          type="text"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          onBlur={() => handleBlur('firstName')}
          aria-required="true"
          aria-invalid={!!(errors.firstName && touched.firstName)}
        />
        {errors.firstName && touched.firstName && (
          <p className="form-error" role="alert">
            {errors.firstName}
          </p>
        )}
      </div>
      
      {/* Last name field */}
      <div className="form-group">
        <label htmlFor="lastName">
          {t('forms.lastName')}
          <span aria-label={t('forms.email.aria.required')}>*</span>
        </label>
        <input
          id="lastName"
          type="text"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          onBlur={() => handleBlur('lastName')}
          aria-required="true"
          aria-invalid={!!(errors.lastName && touched.lastName)}
        />
        {errors.lastName && touched.lastName && (
          <p className="form-error" role="alert">
            {errors.lastName}
          </p>
        )}
      </div>
      
      {/* Submit button */}
      <button 
        type="submit" 
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? t('status.saving') : t('forms.submit')}
      </button>
      
      {/* Screen reader announcement for form submission */}
      <div role="status" aria-live="polite" className="sr-only">
        {submitting && t('status.saving')}
      </div>
    </form>
  );
};

export default SignupForm;
