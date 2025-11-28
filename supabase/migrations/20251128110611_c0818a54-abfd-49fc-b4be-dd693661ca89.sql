-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

-- Storage policies for project files
CREATE POLICY "Anyone can view project files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Authenticated users can upload project files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);