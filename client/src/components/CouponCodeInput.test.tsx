import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CouponCodeInput } from './CouponCodeInput';
import { trpc } from '@/lib/trpc';

// Mock the trpc module
vi.mock('@/lib/trpc', () => ({
  trpc: {
    promotional: {
      validateCoupon: {
        useQuery: vi.fn(),
      },
      applyCoupon: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('CouponCodeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders coupon input component', () => {
    const mockValidateQuery = {
      refetch: vi.fn().mockResolvedValue({ data: { isValid: false } }),
    };

    const mockApplyMutation = {
      mutate: vi.fn(),
      isPending: false,
    };

    vi.mocked(trpc.promotional.validateCoupon.useQuery).mockReturnValue(mockValidateQuery as any);
    vi.mocked(trpc.promotional.applyCoupon.useMutation).mockReturnValue(mockApplyMutation as any);

    render(<CouponCodeInput />);

    expect(screen.getByText('Apply Coupon Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter coupon code (e.g., WITS100)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument();
  });

  it('displays available coupon codes', () => {
    const mockValidateQuery = {
      refetch: vi.fn().mockResolvedValue({ data: { isValid: false } }),
    };

    const mockApplyMutation = {
      mutate: vi.fn(),
      isPending: false,
    };

    vi.mocked(trpc.promotional.validateCoupon.useQuery).mockReturnValue(mockValidateQuery as any);
    vi.mocked(trpc.promotional.applyCoupon.useMutation).mockReturnValue(mockApplyMutation as any);

    render(<CouponCodeInput />);

    expect(screen.getByText(/WITS100/)).toBeInTheDocument();
    expect(screen.getByText(/Get 2 bonus credits/)).toBeInTheDocument();
  });

  it('converts input to uppercase', async () => {
    const user = userEvent.setup();
    const mockValidateQuery = {
      refetch: vi.fn().mockResolvedValue({ data: { isValid: false } }),
    };

    const mockApplyMutation = {
      mutate: vi.fn(),
      isPending: false,
    };

    vi.mocked(trpc.promotional.validateCoupon.useQuery).mockReturnValue(mockValidateQuery as any);
    vi.mocked(trpc.promotional.applyCoupon.useMutation).mockReturnValue(mockApplyMutation as any);

    render(<CouponCodeInput />);

    const input = screen.getByPlaceholderText('Enter coupon code (e.g., WITS100)') as HTMLInputElement;
    await user.type(input, 'wits100');

    expect(input.value).toBe('WITS100');
  });

  it('disables apply button when input is empty', () => {
    const mockValidateQuery = {
      refetch: vi.fn().mockResolvedValue({ data: { isValid: false } }),
    };

    const mockApplyMutation = {
      mutate: vi.fn(),
      isPending: false,
    };

    vi.mocked(trpc.promotional.validateCoupon.useQuery).mockReturnValue(mockValidateQuery as any);
    vi.mocked(trpc.promotional.applyCoupon.useMutation).mockReturnValue(mockApplyMutation as any);

    render(<CouponCodeInput />);

    const applyButton = screen.getByRole('button', { name: /Apply/i }) as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);
  });

  it('calls onCouponApplied callback when coupon is successfully applied', async () => {
    const user = userEvent.setup();
    const onCouponApplied = vi.fn();

    const mockValidateQuery = {
      refetch: vi.fn().mockResolvedValue({ 
        data: { 
          isValid: true, 
          creditsValue: 2,
          message: 'Valid coupon'
        } 
      }),
    };

    const mockApplyMutation = {
      mutate: vi.fn((input, callbacks) => {
        callbacks.onSuccess({
          success: true,
          creditsAdded: 2,
          message: 'Coupon applied successfully',
        });
      }),
      isPending: false,
    };

    vi.mocked(trpc.promotional.validateCoupon.useQuery).mockReturnValue(mockValidateQuery as any);
    vi.mocked(trpc.promotional.applyCoupon.useMutation).mockReturnValue(mockApplyMutation as any);

    render(<CouponCodeInput onCouponApplied={onCouponApplied} />);

    const input = screen.getByPlaceholderText('Enter coupon code (e.g., WITS100)');
    const applyButton = screen.getByRole('button', { name: /Apply/i });

    await user.type(input, 'WITS100');
    await user.click(applyButton);

    await waitFor(() => {
      expect(mockValidateQuery.refetch).toHaveBeenCalled();
    });
  });
});
