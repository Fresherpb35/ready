import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Smartphone, UserCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Button, Input, Divider } from '../../components/common';


// Main Signup Component
const SignupPage = () => {
    const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = () => {
    if (validateForm()) {
      console.log('Signup:', { email, password });
      alert(`Account created!\nEmail: ${email}`);
      navigate("/login");
    }
  };


  const handleGuestContinue = () => {
    console.log('Continue as Guest clicked');
    navigate("/dashboard");
  };
  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-pink-300 to-pink-400 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="bg-white rounded-full w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600">R</div>
            <div className="text-xs font-semibold text-gray-600">Ruready</div>
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-white text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-center">
          Welcome to R U Ready ❤️
        </h1>

        {/* Signup Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 w-full shadow-xl mb-6">
          <div className="space-y-4 sm:space-y-5">
            <Input
              type="email"
              placeholder="Email"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
              required
            />

            <Input
              type="password"
              placeholder="Password"
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: '' });
              }}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={errors.password}
              required
            />

            <Input
              type="password"
              placeholder="Confirm Password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: '' });
              }}
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword}
              required
            />

            <Button onClick={handleSignup} variant="primary">
              Sign Up
            </Button>
          </div>
        </div>

        {/* Divider */}
        <Divider text="OR" />

        {/* Alternative Options */}
        <div className="w-full space-y-4">
         

          <Button
            variant="outline"
            icon={UserCircle}
            onClick={handleGuestContinue}
          >
            Continue as Guest
          </Button>
        </div>

        {/* Already a User */}
        <div className="text-center mt-6 sm:mt-8">
          <span className="text-white text-base sm:text-lg">Already a User? </span>
          <button
            onClick={handleLogin}
            className="text-white font-semibold text-base sm:text-lg underline hover:text-pink-100 transition-colors ml-2"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
