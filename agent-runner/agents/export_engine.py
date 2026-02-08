import os
import json
import subprocess
import glob

class ExportEngine:
    def __init__(self, project_id, base_path="/data/video_factory"):
        self.project_id = project_id
        self.project_path = os.path.join(base_path, project_id)
        self.export_path = os.path.join(self.project_path, "export")
        self.output_file = os.path.join(self.export_path, "final_video.mp4")
        
    def get_max_resolution(self, video_files):
        max_w, max_h = 0, 0
        for f in video_files:
            try:
                cmd = [
                    "ffprobe", "-v", "error", "-select_streams", "v:0",
                    "-show_entries", "stream=width,height", "-of", "json", f
                ]
                result = subprocess.check_output(cmd).decode("utf-8")
                data = json.loads(result)
                w = data["streams"][0]["width"]
                h = data["streams"][0]["height"]
                if w * h > max_w * max_h:
                    max_w, max_h = w, h
            except Exception as e:
                print(f"Error probing {f}: {e}")
        return max_w, max_h

    def run_export(self):
        print(f"🎬 Starting export for project: {self.project_id}")
        
        # 1. Validate Assets
        video_dir = os.path.join(self.project_path, "videos")
        video_files = sorted(glob.glob(os.path.join(video_dir, "*.mp4")))
        if not video_files:
            raise Exception("No video clips found in videos/ directory")
            
        voice_files = glob.glob(os.path.join(self.project_path, "audio", "voice.*"))
        music_files = glob.glob(os.path.join(self.project_path, "musica", "music.*"))
        
        # 2. Determine Target Resolution
        width, height = self.get_max_resolution(video_files)
        if width == 0: width, height = 1280, 720 # Fallback to 720p
        print(f"📐 Target Resolution: {width}x{height}")
        
        # 3. Prepare FFmpeg Command
        # Build concat filter for videos
        filter_complex = ""
        inputs = []
        
        # Video inputs
        for i, f in enumerate(video_files):
            inputs.extend(["-i", f])
            # Scale and pad each video to match target resolution
            filter_complex += f"[{i}:v]scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}];"
        
        # Audio inputs
        audio_idx = len(video_files)
        has_voice = len(voice_files) > 0
        has_music = len(music_files) > 0
        
        if has_voice:
            inputs.extend(["-i", voice_files[0]])
            voice_idx = audio_idx
            audio_idx += 1
        
        if has_music:
            inputs.extend(["-i", music_files[0]])
            music_idx = audio_idx
            audio_idx += 1
            
        # Concat videos
        v_concat = "".join([f"[v{i}]" for i in range(len(video_files))])
        filter_complex += f"{v_concat}concat=n={len(video_files)}:v=1:a=0[v_out];"
        
        # Mix Audio
        if has_voice and has_music:
            filter_complex += f"[{voice_idx}:a]volume=1.0[a_voice];[{music_idx}:a]volume=0.2[a_music];[a_voice][a_music]amix=inputs=2:duration=first[a_out]"
        elif has_voice:
            filter_complex += f"[{voice_idx}:a]volume=1.0[a_out]"
        elif has_music:
            filter_complex += f"[{music_idx}:a]volume=0.2[a_out]"
        else:
            # Silence if no audio
            filter_complex += "anullsrc=r=44100:cl=stereo[a_out]"
            inputs.extend(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"])
            
        # Final Command
        os.makedirs(self.export_path, exist_ok=True)
        cmd = ["ffmpeg", "-y"] + inputs + [
            "-filter_complex", filter_complex,
            "-map", "[v_out]", "-map", "[a_out]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "23",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            self.output_file
        ]
        
        print(f"🚀 Running FFmpeg command...")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, universal_newlines=True)
        for line in process.stdout:
            print(line, end="")
        process.wait()
        
        if process.returncode != 0:
            raise Exception("FFmpeg export failed")
            
        print(f"✅ Export completed: {self.output_file}")
        return self.output_file

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        engine = ExportEngine(sys.argv[1])
        engine.run_export()
