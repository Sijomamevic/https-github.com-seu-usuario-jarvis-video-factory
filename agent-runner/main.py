import os
import json
import time
import redis
import psycopg2
from dotenv import load_dotenv
from agents.jarvis import JarvisAgent

load_dotenv()

# Configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')
DATABASE_URL = os.getenv('DATABASE_URL')

# Initialize Redis
r = redis.from_url(REDIS_URL)

# Initialize Database
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

def update_execution_status(execution_id, status, output=None, error=None):
    try:
        if output:
            cursor.execute(
                "UPDATE executions SET status = %s, output = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                (status, json.dumps(output), execution_id)
            )
        elif error:
            cursor.execute(
                "UPDATE executions SET status = %s, error = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                (status, error, execution_id)
            )
        else:
            cursor.execute(
                "UPDATE executions SET status = %s, started_at = CURRENT_TIMESTAMP WHERE id = %s",
                (status, execution_id)
            )
        conn.commit()
        
        # Publish update
        r.publish('execution-updates', json.dumps({
            'executionId': execution_id,
            'status': status
        }))
    except Exception as e:
        print(f"Error updating execution status: {e}")

def main():
    print("🚀 Jarvis Agent Runner started")
    jarvis = JarvisAgent()
    
    while True:
        # Check for new projects to execute
        task_data = r.brpop('execution-queue', timeout=5)
        
        if task_data:
            task = json.loads(task_data[1])
            project_id = task['projectId']
            print(f"📦 Processing project: {project_id}")
            
            try:
                # Let Jarvis coordinate the project
                jarvis.coordinate_project(project_id)
            except Exception as e:
                print(f"❌ Error coordinating project {project_id}: {e}")
        
        time.sleep(1)

if __name__ == "__main__":
    main()
