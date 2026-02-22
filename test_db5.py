import urllib.request
import json
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld2V2aGR0d2x2aXVkZXR4Z2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTMxNzEsImV4cCI6MjA4MzEyOTE3MX0.jQr91dNKSrwypja7UoDnv8oiE29L_dpy-mPQ_3vW5Sw'
headers = { 'apikey': apikey, 'Authorization': f'Bearer {apikey}' }

try:
    url = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/collaborators?select=id,name,role,status,hire_date,equipe,oab_number,oab_uf"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
        data = json.loads(response.read().decode())

    url_roles = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/roles?select=id,name"
    req_roles = urllib.request.Request(url_roles, headers=headers)
    with urllib.request.urlopen(req_roles, context=ctx, timeout=15) as response:
        roles_data = json.loads(response.read().decode())
    roles_map = {str(r['id']): r['name'] for r in roles_data}

    url_teams = "https://iewevhdtwlviudetxgax.supabase.co/rest/v1/teams?select=id,name"
    req_teams = urllib.request.Request(url_teams, headers=headers)
    with urllib.request.urlopen(req_teams, context=ctx, timeout=15) as response:
        teams_data = json.loads(response.read().decode())
    teams_map = {str(t['id']): t['name'] for t in teams_data}

    total_hd = 0
    total_status = 0
    total_cargo = 0
    
    for v in data:
        if not v.get('hire_date'): continue
        total_hd += 1

        status_limpo = str(v.get('status') or '').strip().lower()
        if 'ativ' not in status_limpo: continue
        total_status += 1

        role_id = str(v.get('role'))
        team_id = str(v.get('equipe'))

        real_role = roles_map.get(role_id, role_id)
        if real_role == "None": real_role = ""

        real_team = teams_map.get(team_id, team_id)
        if real_team == "None": real_team = ""

        cargo_limpo = real_role.strip().lower()
        equipe_limpa = real_team.strip().lower()

        is_valid = ('advogad' in cargo_limpo or 'socio' in cargo_limpo or 'socia' in cargo_limpo or 
                    'estagiario' in cargo_limpo or 'estagiaria' in cargo_limpo or 
                    'juridico' in cargo_limpo or 'legal' in cargo_limpo)
        
        if not is_valid and 'juridico' not in equipe_limpa:
            continue
            
        total_cargo += 1
        
        # Now verify if error happens down the line: returning null logic
        try:
            hd = v['hire_date'].split('T')[0]
            if '/' in hd:
                dia, mes, ano = hd.split('/')
            else:
                ano, mes, dia = hd.split('-')
            int(ano); int(mes); int(dia)
        except Exception as e:
            print(f"FAILED PARSING DATE FOR: {v['name']} -> {v['hire_date']}")

    print(f"Total Initial: {len(data)}")
    print(f"Passed Hire Date: {total_hd}")
    print(f"Passed Status: {total_status}")
    print(f"Passed Cargo: {total_cargo}")

except Exception as e:
    print("ERR:", e)

