/**
 * Animation Utilities
 * 
 * Provides smooth, performant animations and transitions for the application.
 * Uses CSS transforms and will-change properties for optimal performance.
 */

// Animation configuration
export interface AnimationConfig {
    duration?: number;
    easing?: string;
    delay?: number;
    fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Default animation settings
export const DEFAULT_ANIMATION: AnimationConfig = {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    delay: 0,
    fill: 'both'
};

// Easing functions
export const EASINGS = {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounceOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
} as const;

/**
 * Fade in animation
 */
export function fadeIn(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration, easing, delay, fill } = { ...DEFAULT_ANIMATION, ...config };
    
    // Optimize for performance
    element.style.willChange = 'opacity';
    
    const animation = element.animate([
        { opacity: 0 },
        { opacity: 1 }
    ], {
        duration,
        easing,
        delay,
        fill
    });

    // Clean up will-change after animation
    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Fade out animation
 */
export function fadeOut(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration, easing, delay, fill } = { ...DEFAULT_ANIMATION, ...config };
    
    element.style.willChange = 'opacity';
    
    const animation = element.animate([
        { opacity: 1 },
        { opacity: 0 }
    ], {
        duration,
        easing,
        delay,
        fill
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Slide in from top animation
 */
export function slideInFromTop(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration, easing, delay, fill } = { ...DEFAULT_ANIMATION, ...config };
    
    element.style.willChange = 'transform, opacity';
    
    const animation = element.animate([
        { 
            transform: 'translateY(-20px)',
            opacity: 0
        },
        { 
            transform: 'translateY(0)',
            opacity: 1
        }
    ], {
        duration,
        easing,
        delay,
        fill
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Slide in from bottom animation
 */
export function slideInFromBottom(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration, easing, delay, fill } = { ...DEFAULT_ANIMATION, ...config };
    
    element.style.willChange = 'transform, opacity';
    
    const animation = element.animate([
        { 
            transform: 'translateY(20px)',
            opacity: 0
        },
        { 
            transform: 'translateY(0)',
            opacity: 1
        }
    ], {
        duration,
        easing,
        delay,
        fill
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Scale in animation
 */
export function scaleIn(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration, easing, delay, fill } = { ...DEFAULT_ANIMATION, ...config };
    
    element.style.willChange = 'transform, opacity';
    
    const animation = element.animate([
        { 
            transform: 'scale(0.9)',
            opacity: 0
        },
        { 
            transform: 'scale(1)',
            opacity: 1
        }
    ], {
        duration,
        easing,
        delay,
        fill
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Pulse animation for loading states
 */
export function pulse(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration = 1000, easing = EASINGS.easeInOut } = config;
    
    element.style.willChange = 'opacity';
    
    const animation = element.animate([
        { opacity: 1 },
        { opacity: 0.5 },
        { opacity: 1 }
    ], {
        duration,
        easing,
        iterations: Infinity
    });

    return animation;
}

/**
 * Shake animation for errors
 */
export function shake(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration = 500, easing = EASINGS.easeInOut } = config;
    
    element.style.willChange = 'transform';
    
    const animation = element.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
    ], {
        duration,
        easing
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Bounce animation for success states
 */
export function bounce(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration = 600, easing = EASINGS.bounceOut } = config;
    
    element.style.willChange = 'transform';
    
    const animation = element.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.1)' },
        { transform: 'scale(0.95)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
    ], {
        duration,
        easing
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Progress bar animation
 */
export function animateProgress(element: HTMLElement, fromPercent: number, toPercent: number, config: AnimationConfig = {}): Animation {
    const { duration = 500, easing = EASINGS.easeOut } = config;
    
    element.style.willChange = 'width';
    
    const animation = element.animate([
        { width: `${fromPercent}%` },
        { width: `${toPercent}%` }
    ], {
        duration,
        easing,
        fill: 'forwards'
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Stagger animations for lists
 */
export function staggerIn(elements: HTMLElement[], config: AnimationConfig = {}): Animation[] {
    const { delay = 0 } = config;
    const staggerDelay = 100; // 100ms between each element
    
    return elements.map((element, index) => {
        return slideInFromBottom(element, {
            ...config,
            delay: delay + (index * staggerDelay)
        });
    });
}

/**
 * Create a smooth transition between two states
 */
export function transition(
    element: HTMLElement,
    fromStyles: Partial<CSSStyleDeclaration>,
    toStyles: Partial<CSSStyleDeclaration>,
    config: AnimationConfig = {}
): Animation {
    const { duration, easing, delay, fill } = { ...DEFAULT_ANIMATION, ...config };
    
    // Set will-change for all properties that will be animated
    const properties = Object.keys(toStyles);
    element.style.willChange = properties.join(', ');
    
    const keyframes = [fromStyles, toStyles];
    
    const animation = element.animate(keyframes, {
        duration,
        easing,
        delay,
        fill
    });

    animation.addEventListener('finish', () => {
        element.style.willChange = 'auto';
    });

    return animation;
}

/**
 * Create a loading spinner animation
 */
export function spin(element: HTMLElement, config: AnimationConfig = {}): Animation {
    const { duration = 1000, easing = EASINGS.linear } = config;
    
    element.style.willChange = 'transform';
    
    const animation = element.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
    ], {
        duration,
        easing,
        iterations: Infinity
    });

    return animation;
}

/**
 * Animate element entrance based on intersection observer
 */
export function animateOnIntersection(
    element: HTMLElement,
    animationFunction: (el: HTMLElement) => Animation,
    options: IntersectionObserverInit = {}
): IntersectionObserver {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animationFunction(entry.target as HTMLElement);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        ...options
    });

    observer.observe(element);
    return observer;
}

/**
 * Prefers reduced motion check
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate with respect to user preferences
 */
export function respectfulAnimate(
    element: HTMLElement,
    animationFunction: (el: HTMLElement, config?: AnimationConfig) => Animation,
    config: AnimationConfig = {}
): Animation | null {
    if (prefersReducedMotion()) {
        // Skip animation or use a very fast one
        return animationFunction(element, { ...config, duration: 0 });
    }
    
    return animationFunction(element, config);
}
