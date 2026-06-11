import { createFileRoute } from "@tanstack/react-router";
import { certificates, courses } from "@/lib/lms-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, ExternalLink, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — LearnHub" },
      { name: "description", content: "Your earned certifications with downloadable PDFs and verification links." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Certificates</h1>
        <p className="text-sm text-muted-foreground">{certificates.length} certifications earned</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((cert) => {
          const course = courses.find((c) => c.id === cert.courseId)!;
          return (
            <Card key={cert.id} className="overflow-hidden group">
              <div className="relative h-40 bg-gradient-to-br from-primary via-info to-primary p-5 text-primary-foreground">
                <div className="flex items-start justify-between">
                  <Badge className="bg-white/15 hover:bg-white/20 border-0 text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                  <Award className="h-10 w-10 opacity-90" />
                </div>
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="text-[11px] uppercase tracking-wider opacity-80">Certificate of Completion</div>
                  <div className="font-semibold leading-tight line-clamp-2">{cert.title}</div>
                </div>
                <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-foreground font-medium">Issued</div>
                    <div>{cert.issuedOn}</div>
                  </div>
                  <div>
                    <div className="text-foreground font-medium">Expires</div>
                    <div>{cert.expiresOn}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-foreground font-medium">Verification</div>
                    <div className="font-mono text-[11px]">{cert.verificationCode}</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1"><Download className="h-4 w-4 mr-1.5" /> Download PDF</Button>
                  <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                </div>
                <div className="text-[11px] text-muted-foreground">Instructor: {course.instructor}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
