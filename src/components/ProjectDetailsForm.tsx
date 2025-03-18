
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectDetailsFormProps {
  conversationId: string;
  initialData?: {
    project?: string;
    hours?: string;
    summary?: string;
    closed?: string;
    sales_opportunities?: string;
  };
}

interface ProjectOption {
  uppdragsnr: string;
  kund: string;
}

interface FormValues {
  project: string;
  hours: string;
  summary: string;
  closed: boolean;
  sales_opportunities: string;
}

const ProjectDetailsForm = ({ conversationId, initialData }: ProjectDetailsFormProps) => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Normalize closed value from any format to boolean
  const normalizeClosedValue = (value: string | undefined): boolean => {
    if (!value) return false;
    
    const lowercaseValue = value.toLowerCase();
    return lowercaseValue === 'yes' || lowercaseValue === 'ja' || lowercaseValue === 'true';
  };

  const form = useForm<FormValues>({
    defaultValues: {
      project: initialData?.project || "",
      hours: initialData?.hours || "",
      summary: initialData?.summary || "",
      closed: normalizeClosedValue(initialData?.closed),
      sales_opportunities: initialData?.sales_opportunities || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        project: initialData.project || "",
        hours: initialData.hours || "",
        summary: initialData.summary || "",
        closed: normalizeClosedValue(initialData.closed),
        sales_opportunities: initialData.sales_opportunities || "",
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("uppdragsnr, kund")
          .order("uppdragsnr");

        if (error) {
          throw error;
        }

        if (data) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Fel vid hämtning av projekt:", error);
        toast({
          variant: "destructive",
          title: "Fel",
          description: "Misslyckades med att ladda projekt. Försök igen.",
        });
      }
    };

    fetchProjects();
  }, [toast]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Store closed status as "yes" or "no" in the database
      const { error } = await supabase
        .from("conversation_data")
        .update({
          project: values.project,
          hours: values.hours,
          summary: values.summary,
          closed: values.closed ? "yes" : "no",
          sales_opportunities: values.sales_opportunities,
        })
        .eq("conversation_id", conversationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Formulär skickat",
        description: "Dina projektdetaljer har sparats.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Fel vid sparande av formulär:", error);
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Misslyckades med att spara projektdetaljer. Försök igen.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="project"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projekt</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj ett projekt" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.uppdragsnr} value={project.uppdragsnr}>
                      {project.uppdragsnr} - {project.kund}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timmar</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ange timmar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sammanfattning</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ange en sammanfattning av vad som rapporterats"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sales_opportunities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ytterligare behov</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ytterligare behov som kan leda till försäljning"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="closed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Markera som avslutad</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full uppercase" disabled={isLoading}>
          {isLoading ? "SPARAR..." : "SPARA PROJEKTDETALJER"}
        </Button>
      </form>
    </Form>
  );
};

export default ProjectDetailsForm;
