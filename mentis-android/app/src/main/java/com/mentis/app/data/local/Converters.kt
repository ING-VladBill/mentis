package com.mentis.app.data.local

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class Converters {

    private val gson = Gson()

    @TypeConverter
    fun fromStringList(opciones: List<String>): String {
        return gson.toJson(opciones)
    }

    @TypeConverter
    fun toStringList(data: String): List<String> {
        if (data.isBlank()) return emptyList()
        val tipo = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(data, tipo)
    }
}