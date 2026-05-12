import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus } from "lucide-react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { id: string; clerk_user_id: string; email: string; sender: "user" | "admin"; body: string; created_at: string };

export const SupportChat = () => {
  const { user, isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("support_messages").select("*").eq("clerk_user_id", user.id).order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data || []) as Msg[]));

    const channel = supabase.channel("support-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `clerk_user_id=eq.${user.id}` },
        (payload) => setMessages(m => [...m, payload.new as Msg]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "support_messages" },
        (payload) => setMessages(m => m.filter(x => x.id !== (payload.old as any).id)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => { scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (body: string) => {
    if (!user || !body.trim()) return;
    setText("");
    await supabase.from("support_messages").insert({
      clerk_user_id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      sender: "user",
      body,
    });
  };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => send(`[image] ${reader.result}`);
    reader.readAsDataURL(f);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-smooth">
        <div className="text-left">
          <h3 className="font-semibold">Customer Support</h3>
          <p className="text-xs text-muted-foreground">Chat with admin • Realtime</p>
        </div>
        <span className="text-primary text-sm">{open ? "Close" : "Open"}</span>
      </button>
      {open && (
        <div className="border-t border-border animate-fade-in">
          {!isSignedIn ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Sign in to chat with support.</p>
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">Sign in</button>
              </SignInButton>
            </div>
          ) : (
            <>
              <div ref={scrollerRef} className="h-72 overflow-y-auto p-4 space-y-3 bg-background/40">
                {messages.length === 0 && <p className="text-xs text-muted-foreground text-center">Say hello — admin will reply here.</p>}
                {messages.map((m) => {
                  const isImg = m.body.startsWith("[image] ");
                  return (
                    <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        {isImg
                          ? <button onClick={() => setLightbox(m.body.slice(8))} className="block">
                              <img src={m.body.slice(8)} alt="upload" className="rounded-lg max-h-48 hover:opacity-90 transition-smooth cursor-zoom-in" />
                            </button>
                          : <p className="text-sm whitespace-pre-wrap">{m.body}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 p-3 border-t border-border">
                <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-secondary transition-smooth" aria-label="Attach image">
                  <ImagePlus className="w-5 h-5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImage} />
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send(text)}
                  placeholder="Type a message..."
                  className="flex-1 bg-input rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={() => send(text)} className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-smooth" aria-label="Send">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[100] bg-black/90 grid place-items-center p-4 animate-fade-in cursor-zoom-out">
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};
