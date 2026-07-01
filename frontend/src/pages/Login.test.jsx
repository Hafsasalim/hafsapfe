import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './Login';

// 1. Mock global de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// 2. Mock global et direct de useAuth
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(() => Promise.resolve(true)),
  }),
}));

describe('Tests Unitaires Frontend - Page Login', () => {

  test('Vérifie la présence des champs par leur placeholder et du bouton', () => {
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('email@coffeebi.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  test('Vérifie le changement de valeur lorsqu\'on saisit du texte', () => {
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('email@coffeebi.com');
    
    fireEvent.change(emailInput, { target: { value: 'admin@coffeebi.com' } });
    
    expect(emailInput.value).toBe('admin@coffeebi.com');
  });

});