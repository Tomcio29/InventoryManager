import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Login successful - context will handle state update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania');
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'manager' | 'user') => {
    const demoCredentials = {
      admin: { email: 'admin@inventory.local', password: 'admin123' },
      manager: { email: 'manager@inventory.local', password: 'manager123' },
      user: { email: 'user@inventory.local', password: 'user123' },
    };

    const credentials = demoCredentials[role];
    setFormData(credentials);
    
    try {
      await login(credentials.email, credentials.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania demo');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Logowanie
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Wprowadź dane do logowania
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="przykład@email.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Wprowadź hasło"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logowanie...
              </>
            ) : (
              'Zaloguj się'
            )}
          </Button>
        </form>

        {/* Demo Login Buttons */}
        <div className="mt-6 space-y-2">
          <div className="text-sm text-muted-foreground text-center mb-2">
            Konta demonstracyjne:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
              className="text-xs"
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('manager')}
              disabled={isLoading}
              className="text-xs"
            >
              Manager
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDemoLogin('user')}
              disabled={isLoading}
              className="text-xs"
            >
              User
            </Button>
          </div>
          
          {/* Clear Session Button for Development */}
          <div className="mt-4 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.reload();
              }}
              className="w-full text-xs text-red-600 hover:text-red-700"
            >
              🧹 Wyczyść sesję (dev)
            </Button>
          </div>
        </div>
      </CardContent>
      
      {onSwitchToRegister && (
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Nie masz konta?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-medium"
              disabled={isLoading}
            >
              Zarejestruj się
            </button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
