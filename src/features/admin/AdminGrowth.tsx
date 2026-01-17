import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAnalytics from "./AdminAnalytics";

export default function AdminGrowth() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold text-white mb-6">Growth & Marketing</h2>

            <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 rounded-none w-full justify-start p-0 h-10">
                    <TabsTrigger
                        value="metrics"
                        className="rounded-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 h-full px-6 uppercase font-mono text-xs tracking-wider"
                    >
                        Métricas
                    </TabsTrigger>
                    <TabsTrigger
                        value="campaigns"
                        className="rounded-none data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 h-full px-6 uppercase font-mono text-xs tracking-wider"
                    >
                        Campanhas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="mt-6">
                    <AdminAnalytics />
                </TabsContent>

                <TabsContent value="campaigns" className="mt-6">
                    <Card className="bg-black border border-white/20 rounded-none">
                        <CardHeader>
                            <CardTitle className="text-white font-mono uppercase text-sm">Campanhas Globais</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 font-mono text-sm">Funcionalidade de campanhas em desenvolvimento.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
