import { createClient } from "@supabase/supabase-js" // Import createClient from supabase-js

// Función mejorada para guardar el análisis en Supabase
async function saveAnalysisToSupabase(clerkUserId: string, data: any, imageDataURI: string, analysisId: string) {
  try {
    console.log("💾 [SUPABASE] Iniciando guardado para usuario:", clerkUserId)

    // Crear cliente de Supabase con rol de servicio
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ [SUPABASE] Variables de entorno no configuradas")
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-supabase-role": "service_role",
        },
      },
    })

    // PASO 1: Verificar o crear el perfil del usuario
    console.log("🔍 [SUPABASE] Verificando perfil del usuario...")
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single()

    if (profileError && profileError.code === "PGRST116") {
      // El perfil no existe, crearlo
      console.log("📝 [SUPABASE] Creando nuevo perfil...")
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          clerk_id: clerkUserId,
          email: `user_${clerkUserId}@fridgy.app`,
          full_name: `Usuario ${clerkUserId.slice(-4)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (createError) {
        console.error("❌ [SUPABASE] Error al crear perfil:", createError)
        return false
      }

      profile = newProfile
      console.log("✅ [SUPABASE] Perfil creado:", profile.id)
    } else if (profileError) {
      console.error("❌ [SUPABASE] Error al obtener perfil:", profileError)
      return false
    } else {
      console.log("✅ [SUPABASE] Perfil encontrado:", profile.id)
    }

    // PASO 2: Guardar la imagen (opcional, continuar si falla)
    let imageUrl = null
    try {
      console.log("📸 [SUPABASE] Guardando imagen...")
      const imageData = imageDataURI.split(",")[1]
      const imageName = `analysis_${analysisId}_${Date.now()}.jpg`

      const { error: imageError } = await supabase.storage
        .from("analysis-images")
        .upload(imageName, Buffer.from(imageData, "base64"), {
          contentType: "image/jpeg",
          upsert: true,
        })

      if (!imageError) {
        const { data: urlData } = supabase.storage.from("analysis-images").getPublicUrl(imageName)
        imageUrl = urlData.publicUrl
        console.log("✅ [SUPABASE] Imagen guardada:", imageName)
      } else {
        console.log("⚠️ [SUPABASE] Error al guardar imagen:", imageError.message)
      }
    } catch (imageError) {
      console.log("⚠️ [SUPABASE] Error en proceso de imagen, continuando...")
    }

    // PASO 3: Guardar el análisis principal
    console.log("💾 [SUPABASE] Guardando análisis principal...")
    const analysisData = {
      id: analysisId,
      user_id: profile.id,
      image_url: imageUrl,
      ingredients: data.ingredientes || [],
      created_at: new Date().toISOString(),
    }

    console.log("📊 [SUPABASE] Datos del análisis:", JSON.stringify(analysisData, null, 2))

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert(analysisData)
      .select()
      .single()

    if (analysisError) {
      console.error("❌ [SUPABASE] Error al guardar análisis:", analysisError)
      return false
    }

    console.log("✅ [SUPABASE] Análisis guardado:", analysis.id)

    // PASO 4: Guardar las recetas
    if (data.recetas && Array.isArray(data.recetas) && data.recetas.length > 0) {
      console.log(`🍽️ [SUPABASE] Guardando ${data.recetas.length} recetas...`)

      for (let i = 0; i < data.recetas.length; i++) {
        const receta = data.recetas[i]
        try {
          const recipeData = {
            id: crypto.randomUUID(),
            analysis_id: analysisId,
            title: receta.titulo || receta.title || `Receta ${i + 1}`,
            description: receta.descripcion || receta.description || "",
            available_ingredients: receta.ingredientes?.disponibles || [],
            additional_ingredients: receta.ingredientes?.adicionales || [],
            preparation_steps: receta.preparacion || receta.steps || [],
            calories: receta.calorias || receta.calories || 0,
            created_at: new Date().toISOString(),
          }

          console.log(`📝 [SUPABASE] Guardando receta ${i + 1}:`, recipeData.title)

          const { data: recipe, error: recipeError } = await supabase
            .from("recipes")
            .insert(recipeData)
            .select()
            .single()

          if (recipeError) {
            console.error(`❌ [SUPABASE] Error en receta ${i + 1}:`, recipeError)
          } else {
            console.log(`✅ [SUPABASE] Receta ${i + 1} guardada:`, recipe.id)
          }
        } catch (error) {
          console.error(`❌ [SUPABASE] Error procesando receta ${i + 1}:`, error)
        }
      }
    }

    console.log("🎉 [SUPABASE] Guardado completo exitoso")
    return true
  } catch (error) {
    console.error("❌ [SUPABASE] Error general:", error)
    return false
  }
}
