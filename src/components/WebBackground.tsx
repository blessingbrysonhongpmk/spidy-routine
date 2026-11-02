import React from 'react';
import { SymbioteBackground } from './SymbioteBackground';

export interface WebBackgroundProps {
  variant?: 'default' | 'dense' | 'minimal';
  showWebs?: boolean;
  showLightning?: boolean;
  showSymbiote?: boolean;
}

/**
 * WebBackground:
 * Signature global superhero backdrop uniting Spider-Man, Thor, and Venom.
 * Re-exports the unified SymbioteBackground for full backwards-compatibility across all screens.
 */
export const WebBackground: React.FC<WebBackgroundProps> = (props) => {
  return <SymbioteBackground {...props} />;
};
