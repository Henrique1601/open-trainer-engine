-- ==============================================================================
-- Open Trainer Engine: Template de Script Lua Avançado
-- Exemplo: Multiplicador de Dano e Teleporte Seguro
-- ==============================================================================

local Trainer = {}

-- Configuração inicial do cheat
local damageMultiplier = 5.0
local isDamageHookActive = false

function Trainer.onEnable(context)
    print("[LuaTrainer] Ativando script de modificação de dano...")
    
    -- Localiza a função de dano através de assinatura AOB
    local aobAddress = context:scanAOB("F3 0F 59 ?? ?? 0F 28 ?? ?? 0F 29")
    if not aobAddress then
        error("Assinatura AOB para TakeDamage não encontrada na versão atual do jogo.")
        return false
    end
    
    -- Cria um Detour Hook seguro
    context:createHook(aobAddress, function(registers)
        -- registers.xmm0 contém o dano calculado
        local currentDamage = registers:getFloat("xmm0")
        local newDamage = currentDamage * damageMultiplier
        registers:setFloat("xmm0", newDamage)
    end)
    
    isDamageHookActive = true
    print("[LuaTrainer] Hook injetado com sucesso no endereço: " .. string.format("0x%X", aobAddress))
    return true
end

function Trainer.onDisable(context)
    print("[LuaTrainer] Restaurando instruções originais...")
    context:removeHook("TakeDamage")
    isDamageHookActive = false
    return true
end

function Trainer.setMultiplier(value)
    damageMultiplier = tonumber(value) or 1.0
    print("[LuaTrainer] Novo multiplicador de dano configurado: " .. damageMultiplier .. "x")
end

return Trainer
