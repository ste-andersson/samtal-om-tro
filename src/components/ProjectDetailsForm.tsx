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
}

const ProjectDetailsForm = ({ conversationId, initialData }: ProjectDetailsFormProps) => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      form.reset({
        project: initialData.project || "",
        hours: initialData.hours || "",
        summary: initialData.summary || "",
        closed: initialData.closed === "yes",
      });
    }
  }, [initialData]);

  const form = useForm<FormValues>({
    defaultValues: {
      project: initialData?.project || "",
      hours: initialData?.hours || "",
      summary: initialData?.summary || "",
      closed: initialData?.closed === "yes",
    },
  });

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
        console.error("Error fetching projects:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        });
      }
    };

    fetchProjects();
  }, [toast]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("conversation_data")
        .update({
          project: values.project,
          hours: values.hours,
          summary: values.summary,
          closed: values.closed ? "yes" : "no",
        })
        .eq("conversation_id", conversationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Form Submitted",
        description: "Your project details have been saved successfully.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save project details. Please try again.",
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
              <FormLabel>Project</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
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
              <FormLabel>Hours</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter hours" {...field} />
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
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a summary of what was reported"
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
                <FormLabel>Mark as Closed</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Project Details"}
        </Button>
      </form>
    </Form>
  );
};

export default ProjectDetailsForm;
