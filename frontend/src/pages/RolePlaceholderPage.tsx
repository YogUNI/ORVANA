import React from 'react';
import { Card, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface PlaceholderProps {
  title: string;
  roleDescription: string;
}

export const RolePlaceholderPage: React.FC<PlaceholderProps> = ({ title, roleDescription }) => {
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-brand-soft text-brand flex items-center justify-center mx-auto mb-4 font-heading font-black">
          O
        </div>
        <CardTitle className="mb-2">{title}</CardTitle>
        <CardContent>
          <p className="text-sm text-gray-500 mb-6">{roleDescription}</p>
          <a href="/">
            <Button variant="outline" size="sm">
              Kembali ke Beranda
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};
