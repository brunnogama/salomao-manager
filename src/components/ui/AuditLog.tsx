import React from 'react';
import { Clock, User } from 'lucide-react';

interface AuditLogProps {
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export function AuditLog({ createdAt, createdBy, updatedAt, updatedBy }: AuditLogProps) {
  if (!createdAt && !updatedAt) return null;

  const emailToName = (emailOrId?: string | null) => {
    if (!emailOrId) return 'Sistema';
    if (emailOrId.includes('@')) {
      return emailOrId.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
    }
    return emailOrId;
  };

  return (
    <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
      {updatedAt && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
          <Clock className="w-3 h-3" />
          <span>
            Última edição por <strong className="text-gray-700">{emailToName(updatedBy)}</strong> em {new Date(updatedAt).toLocaleString('pt-BR')}
          </span>
        </div>
      )}
      {createdAt && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
          <User className="w-3 h-3" />
          <span>
            Criado por <strong className="text-gray-700">{emailToName(createdBy)}</strong> em {new Date(createdAt).toLocaleString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  );
}
