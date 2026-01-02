import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventory Manager
          </h1>
          <p className="text-gray-600">
            System zarządzania magazynem
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Logowanie</TabsTrigger>
            <TabsTrigger value="register">Rejestracja</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
