import os
import json
import redis
import psycopg2
import time
from openai import OpenAI
from agents.export_engine import ExportEngine

class JarvisAgent:
    def __init__(self):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        import httpx
        self.client = OpenAI(
            api_key=self.api_key, 
            base_url="https://api.deepseek.com",
            http_client=httpx.Client()
        )
        self.redis = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"))
        self.db_url = os.getenv("DATABASE_URL")

    def coordinate_project(self, project_id):
        print(f"🧠 Jarvis is coordinating project: {project_id}")
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        cur.execute("SELECT manifest FROM projects WHERE id = %s", (project_id,))
        manifest = cur.fetchone()[0]
        if not manifest:
            print("❌ Manifest not found")
            return
            
        try:
            # 1. Planning (Neoqeav)
            if manifest.get("status") == "draft" or not manifest.get("scenes"):
                print("✍️ Neoqeav is writing the script...")
                self.log_agent_action(project_id, "neoqeav", "writing script")
                project_name = manifest.get("name", "Sem Nome")
                project_desc = manifest.get("description") or manifest.get("prompt") or "Sem descrição"
                script = self.generate_script(project_name, project_desc)
                manifest["scenes"] = script["scenes"]
                manifest["status"] = "planning_complete"
                self.update_manifest(cur, conn, project_id, manifest, "executing")

            # 2. Production Simulation (Cassiano, Noah, Melissa, Victoria)
            agents = ["cassiano", "noah", "melissa", "victoria"]
            for agent in agents:
                print(f"🤖 {agent.capitalize()} is working...")
                self.log_agent_action(project_id, agent, "processing")
                time.sleep(1)

            # 3. REAL EXPORT (Miriam)
            print("✂️ Miriam is starting real export with FFmpeg...")
            self.log_agent_action(project_id, "miriam", "exporting video")
            
            # The agent runner sees /data as the root for projects
            engine = ExportEngine(project_id, base_path="/data/video_factory")
            video_path = engine.run_export()
            
            # 4. Finalize
            manifest["status"] = "completed"
            manifest["export"] = {
                "status": "done",
                "path": video_path,
                "timestamp": time.time()
            }
            self.update_manifest(cur, conn, project_id, manifest, "completed")
            
            self.redis.publish("execution-updates", json.dumps({"projectId": project_id, "status": "completed"}))
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Error coordinating project {project_id}: {error_msg}")
            self.log_agent_action(project_id, "jarvis", f"error: {error_msg}")
            cur.execute("UPDATE projects SET status = %s WHERE id = %s", ("error", project_id))
            conn.commit()

    def update_manifest(self, cur, conn, project_id, manifest, status):
        cur.execute("UPDATE projects SET manifest = %s, status = %s WHERE id = %s", 
                   (json.dumps(manifest), status, project_id))
        conn.commit()

    def generate_script(self, name, description):
        prompt = f"Crie um roteiro cinematográfico para um vídeo curto de 30 segundos.\nTema: {name}\nDescrição: {description}\nRetorne em JSON com uma lista de \"scenes\", cada uma com \"title\" and \"description\"."
        try:
            response = self.client.chat.completions.create(model="deepseek-reasoner", messages=[{"role": "user", "content": prompt}], response_format={"type": "json_object"})
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error calling DeepSeek: {e}")
            return {"scenes": [{"title": "Cena 1", "description": "Introdução."}, {"title": "Cena 2", "description": "Desenvolvimento."}, {"title": "Cena 3", "description": "Conclusão."}]}

    def log_agent_action(self, project_id, agent_name, action):
        self.redis.publish("agent-events", json.dumps({
            "projectId": project_id,
            "agentName": agent_name,
            "action": action,
            "timestamp": time.time()
        }))
