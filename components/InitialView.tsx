import React, { useRef } from 'react';
import { SimpleRAGUpload } from './SimpleRAGUpload';
import { AnalysisResult } from '../types';

interface InitialViewProps {
    onUploadClick: () => void;
    onGenerateTemplate: () => void;
    onAnalysisComplete?: (result: AnalysisResult, fileName: string) => void;
}

const InitialView: React.FC<InitialViewProps> = ({ onUploadClick, onGenerateTemplate, onAnalysisComplete }) => {
    return (
        <div className="pt-6 relative">
            <div className="mb-6 sm:mb-8 animate-fadeInSlideUp">
                 <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-3 sm:mb-4 py-2">Justice. Instantanée.</h1>
                <p className="text-base sm:text-lg text-gray-400 max-w-2xl">
                    Analysez vos documents, détectez les problèmes cachés et traduisez le langage juridique complexe en insights clairs et compréhensibles avec Justicia.
                </p>
            </div>
            <div className="space-y-4 sm:space-y-6 animate-fadeInSlideUp" style={{animationDelay: '150ms'}}>
                <SimpleRAGUpload onAnalysisComplete={onAnalysisComplete} />
            </div>
        </div>
    );
};

export default InitialView;
