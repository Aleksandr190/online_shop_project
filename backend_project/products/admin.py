from django.contrib import admin
from .models import Product, SiteSettings

admin.site.register(Product)

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    # Запрещаем добавлять новые записи, если одна уже есть
    def has_add_permission(self, request):
        if SiteSettings.objects.exists():
            return False
        return True

    # Запрещаем удалять настройки, чтобы сайт не сломался
    def has_delete_permission(self, request, obj=None):
        return False
