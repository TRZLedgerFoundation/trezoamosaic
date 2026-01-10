import { useInputValidation } from '@/hooks/use-input-validation';
import { Input } from '@/components/ui/input';

interface TrezoaAddressInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    helpText?: string;
    disabled?: boolean;
    required?: boolean;
    showValidation?: boolean;
}

export function TrezoaAddressInput({
    label,
    value,
    onChange,
    placeholder = 'Enter Trezoa address...',
    helpText,
    disabled = false,
    required = false,
    showValidation = true,
}: TrezoaAddressInputProps) {
    const { validateTrezoaAddress } = useInputValidation();
    const isValid = !value || validateTrezoaAddress(value);

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className=""
                disabled={disabled}
            />
            {helpText && <p className="text-xs text-muted-foreground mt-1">{helpText}</p>}
            {showValidation && value && !isValid && (
                <p className="text-sm text-red-600 mt-1">Please enter a valid Trezoa address</p>
            )}
        </div>
    );
}
