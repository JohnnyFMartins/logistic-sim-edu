import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { simulacao_id } = await req.json()
    console.log('Running simulation for ID:', simulacao_id)

    if (!simulacao_id) {
      return new Response(
        JSON.stringify({ error: 'simulacao_id is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get simulation data
    const { data: simulacao, error: simError } = await supabaseClient
      .from('simulacoes')
      .select('*')
      .eq('id', simulacao_id)
      .single()

    if (simError || !simulacao) {
      console.error('Error fetching simulation:', simError)
      return new Response(
        JSON.stringify({ error: 'Simulation not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Get base trip data with relations
    const { data: viagem, error: viagemError } = await supabaseClient
      .from('trips')
      .select('*')
      .eq('id', simulacao.viagem_base_id)
      .single()

    if (viagemError || !viagem) {
      console.error('Error fetching base trip:', viagemError)
      return new Response(
        JSON.stringify({ error: 'Base trip not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Get route data
    const { data: rota, error: rotaError } = await supabaseClient
      .from('routes')
      .select('*')
      .eq('id', viagem.route_id)
      .single()

    if (rotaError || !rota) {
      console.error('Error fetching route:', rotaError)
      return new Response(
        JSON.stringify({ error: 'Route not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Get vehicle data
    const { data: veiculo, error: veiculoError } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('id', viagem.vehicle_id)
      .single()

    if (veiculoError || !veiculo) {
      console.error('Error fetching vehicle:', veiculoError)
      return new Response(
        JSON.stringify({ error: 'Vehicle not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Get global parameters
    const { data: parametros, error: paramError } = await supabaseClient
      .from('parametros_globais')
      .select('*')
      .eq('user_id', simulacao.user_id)
      .single()

    if (paramError || !parametros) {
      console.error('Error fetching global parameters:', paramError)
      return new Response(
        JSON.stringify({ error: 'Global parameters not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Get active fixed costs
    const { data: custosFixos, error: fixosError } = await supabaseClient
      .from('custos_fixos')
      .select('valor_mensal')
      .eq('user_id', simulacao.user_id)
      .eq('ativo', true)

    if (fixosError) {
      console.error('Error fetching fixed costs:', fixosError)
      return new Response(
        JSON.stringify({ error: 'Error fetching fixed costs' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Get active variable costs
    const { data: custosVariaveis, error: variaveisError } = await supabaseClient
      .from('custos_variaveis')
      .select('valor_por_km')
      .eq('user_id', simulacao.user_id)
      .eq('ativo', true)

    if (variaveisError) {
      console.error('Error fetching variable costs:', variaveisError)
      return new Response(
        JSON.stringify({ error: 'Error fetching variable costs' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Get route tolls
    const { data: pedagios, error: pedagogiosError } = await supabaseClient
      .from('pedagios')
      .select('valor')
      .eq('rota_id', rota.id)
      .eq('user_id', simulacao.user_id)

    if (pedagogiosError) {
      console.error('Error fetching tolls:', pedagogiosError)
      return new Response(
        JSON.stringify({ error: 'Error fetching tolls' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Apply overrides or use base values
    const precoDiesel = simulacao.preco_diesel_litro || parametros.preco_diesel_litro
    const kmPorLitro = simulacao.km_por_litro || veiculo.km_por_litro
    const velocidadeMedia = simulacao.velocidade_media_kmh || parametros.velocidade_media_kmh
    const entregasNaRota = simulacao.entregas_na_rota || 1
    const custoVarExtraPorKm = simulacao.custo_var_extra_por_km || 0
    const pedagogiosExtra = simulacao.pedagios_extra || 0
    const ocupacaoPct = simulacao.ocupacao_pct || 100

    // Calculate simulation results
    const distanciaKm = rota.distancia_km
    const consumoCombustivel = distanciaKm / kmPorLitro
    const custoCombustivel = consumoCombustivel * precoDiesel
    
    const somaCustosVariaveis = custosVariaveis?.reduce((sum, custo) => sum + Number(custo.valor_por_km), 0) || 0
    const custoVariaveis = (somaCustosVariaveis + custoVarExtraPorKm) * distanciaKm
    
    const somaPedagios = pedagios?.reduce((sum, pedagio) => sum + Number(pedagio.valor), 0) || 0
    const custoPedagios = somaPedagios + pedagogiosExtra
    
    const somaCustosFixos = custosFixos?.reduce((sum, custo) => sum + Number(custo.valor_mensal), 0) || 0
    const custoFixoRateado = somaCustosFixos / 30 // Daily rate
    
    const custoTotal = custoCombustivel + custoVariaveis + custoPedagios + custoFixoRateado
    const custoPorEntrega = custoTotal / entregasNaRota
    const tempoEstimado = distanciaKm / velocidadeMedia
    
    // Calculate cost per ton-km if weight is available
    let custoPorToneladaKm = null
    if (viagem.peso_ton && viagem.peso_ton > 0) {
      custoPorToneladaKm = custoTotal / (viagem.peso_ton * distanciaKm)
    }
    
    // Calculate margin if revenue exists
    let margem = null
    if (viagem.receita && viagem.receita > 0) {
      margem = ((viagem.receita - custoTotal) / viagem.receita) * 100
    }

    // Update simulation with calculated results
    const { error: updateError } = await supabaseClient
      .from('simulacoes')
      .update({
        custo_total: custoTotal,
        custo_por_entrega: custoPorEntrega,
        custo_por_tonelada_km: custoPorToneladaKm,
        margem: margem,
        consumo_combustivel_l: consumoCombustivel,
        custo_combustivel: custoCombustivel,
        custo_variaveis: custoVariaveis,
        custo_pedagios: custoPedagios,
        custo_fixo_rateado: custoFixoRateado,
        tempo_estimado_h: tempoEstimado,
        updated_at: new Date().toISOString()
      })
      .eq('id', simulacao_id)

    if (updateError) {
      console.error('Error updating simulation:', updateError)
      return new Response(
        JSON.stringify({ error: 'Error updating simulation results' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Simulation completed successfully')
    return new Response(
      JSON.stringify({ 
        success: true,
        results: {
          custo_total: custoTotal,
          custo_por_entrega: custoPorEntrega,
          custo_por_tonelada_km: custoPorToneladaKm,
          margem: margem,
          consumo_combustivel_l: consumoCombustivel,
          custo_combustivel: custoCombustivel,
          custo_variaveis: custoVariaveis,
          custo_pedagios: custoPedagios,
          custo_fixo_rateado: custoFixoRateado,
          tempo_estimado_h: tempoEstimado
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in rodar-simulacao function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})