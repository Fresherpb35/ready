import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";
// Reusable Button Component
const Button = ({ 
  children, 
  variant = 'primary', 
  icon: Icon, 
  onClick, 
  type = 'button',
  disabled = false,
  className = ''
}) => {
  const variants = {
    primary: 'bg-pink-500 hover:bg-pink-600 text-white disabled:bg-pink-300',
    secondary: 'bg-pink-300 hover:bg-pink-400 text-white disabled:bg-pink-200',
    outline: 'bg-white hover:bg-pink-50 text-pink-500 border-2 border-pink-300 disabled:bg-gray-100 disabled:text-gray-400'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-6 rounded-2xl font-medium 
        transition-all duration-200 
        flex items-center justify-center gap-3 text-lg
        disabled:cursor-not-allowed disabled:opacity-60
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon size={24} />}
      {children}
    </button>
  );
};

// Reusable Input Component
const Input = ({ 
  type = 'text', 
  placeholder, 
  icon: Icon, 
  value, 
  onChange, 
  disabled = false,
  name = '',
  required = false,
  error = '',
  className = ''
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
            <Icon size={24} />
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          name={name}
          required={required}
          className={`
            w-full py-4 pr-4 rounded-2xl border-2 
            focus:outline-none text-lg transition-colors
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${Icon ? 'pl-14' : 'pl-4'}
            ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-pink-400'}
            ${className}
          `}
        />
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>
      )}
    </div>
  );
};

// Main Forgot Password Component
const ForgotPassword = () => {
  
  
const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Successful submission
   
    setIsSubmitted(true);
    
    // Simulate sending email
    setTimeout(() => {
      alert(`Password reset link sent to:\n${email}`);
    }, 500);
  };

  const handleBackToLogin = () => {
  
  navigate('/login');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-pink-300 to-pink-400 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative">
      {/* Back Button */}
      <button
        onClick={handleBackToLogin}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-white hover:text-pink-100 transition-colors"
      >
        <ArrowLeft size={24} />
        <span className="hidden sm:inline font-medium">Back to Login</span>
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="bg-white rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">R</div>
            <div className="text-xs font-semibold text-gray-600">Ruready</div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-white text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-center">
          Reset Your Password ❤️
        </h1>

        {/* Reset Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 w-full shadow-xl mb-6">
          {!isSubmitted ? (
            <div className="space-y-5">
              <div onKeyPress={handleKeyPress}>
                <Input
                  type="email"
                  placeholder="Enter your Email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  error={error}
                  required
                />
              </div>

              <Button onClick={handleSubmit} variant="primary">
                Send Reset Link
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Sent!</h3>
              <p className="text-gray-600">Check your inbox for the reset link.</p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-4 text-pink-500 font-medium hover:text-pink-600"
              >
                Resend Email
              </button>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-white text-center text-sm sm:text-base px-4">
          Enter your email and we'll send you a link<br className="hidden sm:block" />
          to reset your password.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
