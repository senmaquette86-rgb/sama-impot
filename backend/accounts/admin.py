from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    ordering = ["-date_inscription"]
    list_display = [
        "email", "first_name", "last_name",
        "type_contribuable", "is_staff", "date_inscription",
    ]
    list_filter = ["type_contribuable", "is_staff", "is_active"]
    search_fields = ["email", "first_name", "last_name", "ninea"]
    readonly_fields = ["date_inscription", "last_login", "date_joined"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name", "telephone", "adresse")}),
        ("Informations fiscales", {"fields": ("ninea", "type_contribuable")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined", "date_inscription")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "type_contribuable", "password1", "password2"),
        }),
    )
