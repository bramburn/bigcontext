/**
 * ValidatedInput Component Integration Tests
 * 
 * Tests for the ValidatedInput component including user interactions,
 * validation behavior, and event handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ValidatedInput from './ValidatedInput.svelte';
import { validators } from '$lib/utils/validation';

describe('ValidatedInput Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render text input with label', () => {
			const { getByLabelText, getByText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					placeholder: 'Enter text'
				}
			});

			expect(getByText('Test Input')).toBeInTheDocument();
			expect(getByLabelText('Test Input')).toBeInTheDocument();
		});

		it('should render select input with options', () => {
			const { getByLabelText } = render(ValidatedInput, {
				props: {
					type: 'select',
					label: 'Test Select',
					value: '',
					options: [
						{ value: 'option1', label: 'Option 1' },
						{ value: 'option2', label: 'Option 2' }
					]
				}
			});

			const select = getByLabelText('Test Select');
			expect(select).toBeInTheDocument();
			expect(select.tagName.toLowerCase()).toBe('fluent-select');
		});

		it('should show required indicator when required', () => {
			const { getByText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Required Input',
					required: true
				}
			});

			expect(getByText('*')).toBeInTheDocument();
		});

		it('should be disabled when disabled prop is true', () => {
			const { getByLabelText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Disabled Input',
					disabled: true
				}
			});

			const input = getByLabelText('Disabled Input');
			expect(input).toHaveAttribute('disabled');
		});
	});

	describe('User Interactions', () => {
		it('should emit input event when value changes', async () => {
			const { getByLabelText, component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: ''
				}
			});

			const inputEvents: any[] = [];
			component.$on('input', (event) => {
				inputEvents.push(event.detail);
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: 'test value' } });

			expect(inputEvents).toHaveLength(1);
			expect(inputEvents[0]).toEqual({
				value: 'test value',
				isValid: true
			});
		});

		it('should emit blur event when input loses focus', async () => {
			const { getByLabelText, component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: 'initial'
				}
			});

			const blurEvents: any[] = [];
			component.$on('blur', (event) => {
				blurEvents.push(event.detail);
			});

			const input = getByLabelText('Test Input');
			await fireEvent.blur(input);

			expect(blurEvents).toHaveLength(1);
			expect(blurEvents[0]).toEqual({ value: 'initial' });
		});

		it('should emit focus event when input gains focus', async () => {
			const { getByLabelText, component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: 'initial'
				}
			});

			const focusEvents: any[] = [];
			component.$on('focus', (event) => {
				focusEvents.push(event.detail);
			});

			const input = getByLabelText('Test Input');
			await fireEvent.focus(input);

			expect(focusEvents).toHaveLength(1);
			expect(focusEvents[0]).toEqual({ value: 'initial' });
		});
	});

	describe('Validation Behavior', () => {
		it('should validate on input when validateOnChange is true', async () => {
			const { getByLabelText, component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required,
					validateOnChange: true
				}
			});

			const validationEvents: any[] = [];
			component.$on('validation', (event) => {
				validationEvents.push(event.detail);
			});

			const input = getByLabelText('Test Input');
			
			// First input should trigger validation
			await fireEvent.input(input, { target: { value: '' } });
			await waitFor(() => {
				expect(validationEvents.length).toBeGreaterThan(0);
			});

			// Should show validation error for empty required field
			expect(validationEvents[0].result.isValid).toBe(false);
			expect(validationEvents[0].result.errors).toContain('Field is required');
		});

		it('should validate on blur when validateOnBlur is true', async () => {
			const { getByLabelText, component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required,
					validateOnChange: false,
					validateOnBlur: true
				}
			});

			const validationEvents: any[] = [];
			component.$on('validation', (event) => {
				validationEvents.push(event.detail);
			});

			const input = getByLabelText('Test Input');
			
			// Input should not trigger validation
			await fireEvent.input(input, { target: { value: '' } });
			expect(validationEvents).toHaveLength(0);

			// Blur should trigger validation
			await fireEvent.blur(input);
			await waitFor(() => {
				expect(validationEvents.length).toBeGreaterThan(0);
			});

			expect(validationEvents[0].result.isValid).toBe(false);
		});

		it('should show validation icon when validation is complete', async () => {
			const { getByLabelText, container } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: 'valid value',
					validator: validators.required,
					showValidationIcon: true
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: 'valid value' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				const successIcon = container.querySelector('.success-icon');
				expect(successIcon).toBeInTheDocument();
			});
		});

		it('should show error icon for invalid input', async () => {
			const { getByLabelText, container } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required,
					showValidationIcon: true
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				const errorIcon = container.querySelector('.error-icon');
				expect(errorIcon).toBeInTheDocument();
			});
		});

		it('should show loading spinner during validation', async () => {
			const slowValidator = vi.fn(() => {
				return new Promise(resolve => {
					setTimeout(() => resolve(validators.required('test')), 100);
				});
			});

			const { getByLabelText, container } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: slowValidator,
					showValidationIcon: true,
					debounceMs: 0
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: 'test' } });

			// Should show loading spinner
			const loadingSpinner = container.querySelector('.loading-spinner');
			expect(loadingSpinner).toBeInTheDocument();
		});
	});

	describe('Validation Messages', () => {
		it('should display error messages', async () => {
			const { getByLabelText, getByText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				expect(getByText('Field is required')).toBeInTheDocument();
			});
		});

		it('should display warning messages', async () => {
			const warningValidator = () => ({
				isValid: true,
				errors: [],
				warnings: ['This is a warning'],
				suggestions: []
			});

			const { getByLabelText, getByText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: 'test',
					validator: warningValidator
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: 'test' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				expect(getByText('This is a warning')).toBeInTheDocument();
			});
		});

		it('should display suggestion messages', async () => {
			const suggestionValidator = () => ({
				isValid: true,
				errors: [],
				warnings: [],
				suggestions: ['This is a suggestion']
			});

			const { getByLabelText, getByText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: 'test',
					validator: suggestionValidator
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: 'test' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				expect(getByText('This is a suggestion')).toBeInTheDocument();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes', () => {
			const { getByLabelText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: ''
				}
			});

			const input = getByLabelText('Test Input');
			expect(input).toHaveAttribute('role', 'textbox');
			expect(input).toHaveAttribute('aria-label', 'Test Input');
		});

		it('should set aria-invalid when validation fails', async () => {
			const { getByLabelText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				expect(input).toHaveAttribute('aria-invalid', 'true');
			});
		});

		it('should associate validation messages with input', async () => {
			const { getByLabelText } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);

			await waitFor(() => {
				const describedBy = input.getAttribute('aria-describedby');
				expect(describedBy).toContain('validation-Test Input');
			});
		});
	});

	describe('Component Methods', () => {
		it('should clear validation when clearValidation is called', async () => {
			const { getByLabelText, component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required
				}
			});

			const input = getByLabelText('Test Input');
			await fireEvent.input(input, { target: { value: '' } });
			await fireEvent.blur(input);

			// Wait for validation to complete
			await waitFor(() => {
				expect(input).toHaveAttribute('aria-invalid', 'true');
			});

			// Clear validation
			component.clearValidation();

			// Validation should be cleared
			expect(input).not.toHaveAttribute('aria-invalid');
		});

		it('should trigger validation when validate is called', async () => {
			const { component } = render(ValidatedInput, {
				props: {
					type: 'text',
					label: 'Test Input',
					value: '',
					validator: validators.required
				}
			});

			const validationEvents: any[] = [];
			component.$on('validation', (event) => {
				validationEvents.push(event.detail);
			});

			// Trigger validation manually
			await component.validate();

			expect(validationEvents).toHaveLength(1);
			expect(validationEvents[0].result.isValid).toBe(false);
		});
	});
});
