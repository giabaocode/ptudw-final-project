import React, {createContext, useContext, useState, useEffect} from 'react';
import {User} from '../types';

interface AuthContextType{
    isLoggedIn: boolean;
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');    
        if(storedToken && storedUser){
           try{
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            } catch (error){
                console.error('Failed to parse stored user:', error);
                localStorage.clear();
           }
        }
    }, []);
}