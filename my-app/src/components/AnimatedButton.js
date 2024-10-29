import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  border: none;
  padding: 12px 24px;
  font-size: 1.1rem;
  font-weight: 400;
  border-radius: 25px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  background: ${props => props.danger
    ? 'linear-gradient(145deg, #f44336, #d32f2f)'
    : 'linear-gradient(145deg, #f4be7e, #c99b64)'};
  color: ${props => props.danger ? '#ffffff' : '#4a3000'};

  &:hover {
    background: ${props => props.danger
      ? 'linear-gradient(145deg, #d32f2f, #b71c1c)'
      : 'linear-gradient(145deg, #e5a55d, #b88a53)'};
    transform: scale(1.05);
  }
`;

const AnimatedButton = ({ children, onClick, className, danger = false }) => {
  return (
    <StyledButton
      className={`animated-button ${className}`}
      onClick={onClick}
      danger={danger}
    >
      {children}
    </StyledButton>
  );
};

export default AnimatedButton;
