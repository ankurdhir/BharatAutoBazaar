from django.db import migrations, models
import phonenumber_field.modelfields


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='otptoken',
            name='email',
            field=models.EmailField(blank=True, null=True, max_length=254),
        ),
        migrations.AlterField(
            model_name='otptoken',
            name='phone_number',
            field=phonenumber_field.modelfields.PhoneNumberField(blank=True, null=True, max_length=128, region=None),
        ),
    ]


