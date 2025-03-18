
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export type DataCollection = {
  project?: string;
  hours?: string;
  summary?: string;
  closed?: string;
  sales_opportunities?: string;
};

interface DataCollectionDisplayProps {
  data: DataCollection | null;
  isLoading: boolean;
  savedToDatabase?: boolean;
}

const DataCollectionDisplay = ({ data, isLoading, savedToDatabase }: DataCollectionDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-6 border-brand-dark/20">
        <CardHeader className="bg-brand-light/50">
          <CardTitle className="text-xl font-architekt">
            <Skeleton className="h-6 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-6 border-brand-dark/20">
      <CardHeader className="bg-brand-light/50">
        <CardTitle className="text-xl font-architekt text-brand-dark">Konversationsdata</CardTitle>
        <CardDescription className="text-brand-dark/70">Information insamlad under din konversation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 font-maison">
        {data.project && (
          <div>
            <span className="font-semibold text-brand-dark">Projekt:</span> {data.project}
          </div>
        )}
        {data.hours && (
          <div>
            <span className="font-semibold text-brand-dark">Timmar:</span> {data.hours}
          </div>
        )}
        {data.summary && (
          <div>
            <span className="font-semibold text-brand-dark">Sammanfattning:</span> {data.summary}
          </div>
        )}
        {data.sales_opportunities && (
          <div>
            <span className="font-semibold text-brand-dark">Ytterligare behov:</span> {data.sales_opportunities}
          </div>
        )}
        {data.closed !== undefined && (
          <div>
            <span className="font-semibold text-brand-dark">Status:</span> {data.closed === "yes" ? "Avslutad" : "Öppen"}
          </div>
        )}
      </CardContent>
      {savedToDatabase !== undefined && (
        <CardFooter className="pt-2">
          <div className={`text-sm ${savedToDatabase ? 'text-brand-accent' : 'text-amber-600'} flex items-center font-maison`}>
            {savedToDatabase ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Data sparad i databasen
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Inte sparad i databasen än
              </>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DataCollectionDisplay;
