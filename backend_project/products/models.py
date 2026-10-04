from django.db import models


class Product(models.Model):
    """ Модель товара.
    """
    title = models.CharField(max_length=255, verbose_name="Название товара")
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.DecimalField(max_length=10, decimal_places=2, max_digits=10, verbose_name="Цена")
    image = models.ImageField(upload_to='products/', verbose_name="Изображение товара")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['-created_at'] # Новые товары будут выше в списке

class SiteSettings(models.Model):
    """ Модель настроек сайта.
    """
    site_name = models.CharField(max_length=100, default="Магазин ожерелий", verbose_name="Название магазина")
    phone = models.CharField(max_length=20, default="+X (XXX) XXX-XX-XX", verbose_name="Телефон")
    logo = models.ImageField(upload_to="site_info/", verbose_name="Логотип", blank=True, null=True)

    class Meta:
        verbose_name = "Настройки сайта"
        verbose_name_plural = "Настройки сайта"

    def save(self, *args, **kwargs):
        # Если запись уже есть, запрещаем создавать новую, а обновляем текущую
        if not self.pk and SiteSettings.objects.exists():
            return
        super().save(*args, **kwargs)

    def __str__(self):
        return "Общие настройки сайта"
