const fs = require('fs');

const shifted = fs.readFileSync('tmp_map_shifted.txt', 'utf8');
let current = fs.readFileSync('src/components/collaborators/components/RHMapaAndar31.tsx', 'utf8');

// Extrair W_STD ate o array SEATS_31_ANDAR
const seatsMatch = shifted.match(/const W_STD = 75;[\s\S]*?\];/);
const newSeatsCode = seatsMatch[0];

// Replace na current
current = current.replace(/const W_STD = 86;[\s\S]*?\];/, newSeatsCode);

// Extrair walls
const wallsMatch = shifted.match(/\{\/\* Left Seniores Rooms \*\/\}[\s\S]*?\{\/\* S16-S18 Walls inside Right Area \*\/\}[\s\S]*?<\/div>/);
const newWalls = wallsMatch[0];

// Replace walls
current = current.replace(/\{\/\* Left Seniores Rooms \*\/\}[\s\S]*?\{\/\* S16-S18 Walls inside Right Area \*\/\}[\s\S]*?<\/div>/, newWalls);

// Modificar card de ocupante para incluir a foto pequena com a estrutura exata do print (com borda preta) mas contornando a foto.
// E adicionar botão X
const uiBlock = `              <div className="flex flex-col items-center justify-center w-full h-full p-0.5 border border-black bg-white group-hover:bg-[#1e3a8a]/5 transition-colors group">
                {occupant ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSeat(String(occupant.id));
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full hidden group-hover:flex items-center justify-center cursor-pointer shadow-md hover:bg-red-600 transition-colors z-30"
                      title="Desvincular ocupante deste posto"
                    >
                      <span className="text-white text-[10px] leading-none font-bold pb-[1px]">x</span>
                    </button>
                    {/* Foto pequena no meio */}
                    {occupant.foto_url || occupant.photo_url ? (
                      <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border border-gray-100">
                        <img src={occupant.foto_url || occupant.photo_url} className="w-full h-full object-cover" alt="" />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center bg-gray-100 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Nome compacto legível com o scale */}
                    <span className="block text-[8px] font-bold text-gray-900 text-center leading-[1.1] uppercase w-full truncate mt-0.5 px-[1px]">
                      {occupant.name.split(' ')[0]} {occupant.name.split(' ').length > 1 ? occupant.name.split(' ')[occupant.name.split(' ').length - 1].charAt(0)+'.' : ''}
                    </span>
                    <span className="block text-[5px] font-black text-gray-500 uppercase mt-[1px] w-full text-center truncate px-[1px]">
                      {getShortRole(occupant.roles?.name || occupant.role || '')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={\`block text-[10px] font-black leading-none mb-0.5 \${seat.type.includes('ADMINISTRATIVO') || seat.type.includes('ADM') ? 'text-purple-700' : seat.type === 'SÊNIOR' || seat.type === 'SÓCIO' ? 'text-red-600' : 'text-[#1e3a8a]'} opacity-70\`}>
                      {seat.id}
                    </span>
                    <span className={\`block text-[7px] font-bold tracking-widest uppercase text-center w-full mt-0.5 opacity-60 \${seat.type === 'SÓCIO' ? 'text-red-700' : seat.type === 'SÊNIOR' ? 'text-red-600' : seat.type === 'ESTAGIÁRIO' ? 'text-orange-600' : seat.type === 'ADMINISTRATIVO' ? 'text-purple-700' : seat.type === 'CONSULTOR' ? 'text-amber-600' : seat.type === 'JÚNIOR' ? 'text-blue-600' : 'text-emerald-600'}\`}>
                      {seat.type}
                    </span>
                  </>
                )}
                {/* Drag Overlay para editar ou desvincular */}
                {occupant && !isEditMode && (
                  <div 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('colabId', String(occupant.id));
                    }}
                    onDoubleClick={() => onRemoveSeat(String(occupant.id))}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 block pointer-events-auto"
                    title="Arraste de volta para a lista ou clique duplo para remover"
                  />
                )}
              </div>`

// Localizar a div de conteúdo
const uiRegex = /<div className="relative flex flex-col items-center justify-evenly[\s\S]*?<\/div>\n\s*\}\)\}\n\s*<\/div>/;

// Nós só queremos trocar aquele bloco if(occupant) else que é longo
const visualTableMatch = current.match(/\{\/\* CONTEÚDO VISUAL DA MESA \*\/\}[\s\S]*?(?=\{\/\* Overlay HTML5 Drag Drop)/);
if(visualTableMatch) {
  // we actually want to replace everything from {/* CONTEÚDO VISUAL DA MESA */} to the end of the motion.div return
  const fullContentRegex = /\{\/\* CONTEÚDO VISUAL DA MESA \*\/\}[\s\S]*?\n\s+(?=<\/motion.div>)/;
  current = current.replace(fullContentRegex, "{/* CONTEÚDO VISUAL DA MESA */}\n" + uiBlock + "\n              ");
}

// Adjust scale wrap to inner wrapper so everything gets 20% bigger
// the wrapper: <div id="mapa-31-andar-content" className="..." style={{...}}>
current = current.replace(/id="mapa-31-andar-content".*?style=\{\{/s, (match) => match + "\n          transform: 'scale(1.15)',\n          transformOrigin: 'top left',\n          width: MAP_W * 1.15,\n          height: MAP_H * 1.15,\n          // " );
current = current.replace(/width: MAP_W, \n\s*height: MAP_H,/, '');

fs.writeFileSync('src/components/collaborators/components/RHMapaAndar31.tsx', current);
