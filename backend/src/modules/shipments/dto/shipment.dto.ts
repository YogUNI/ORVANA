import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({
    description: 'ID Dapur Gizi penerima (semua order harus menuju dapur yang sama)',
    example: 'kitchen-a-id',
  })
  @IsString({ message: 'kitchenId harus berupa teks' })
  @IsNotEmpty({ message: 'kitchenId wajib diisi' })
  kitchenId!: string;

  @ApiProperty({
    description: 'Daftar ID pesanan (status ACCEPTED) yang dikonsolidasikan',
    example: ['order-id-1', 'order-id-2'],
  })
  @IsArray({ message: 'orderIds harus berupa array string' })
  @ArrayMinSize(1, { message: 'Minimal harus memilih 1 pesanan untuk pengiriman' })
  @IsString({ each: true, message: 'Setiap orderId harus berupa teks' })
  orderIds!: string[];

  @ApiProperty({
    description: 'Waktu rencana penjemputan/keberangkatan pengiriman',
    example: '2026-10-14T05:00:00.000Z',
  })
  @IsDateString({}, { message: 'scheduledAt harus berupa format tanggal ISO 8601' })
  scheduledAt!: string;

  @ApiProperty({
    description: 'Estimasi biaya transportasi pengiriman (Rupiah)',
    example: 75000,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'transportCost harus berupa angka' })
  @Min(0, { message: 'transportCost tidak boleh negatif' })
  transportCost?: number;

  @ApiProperty({
    description: 'Catatan rute atau armada penjemputan',
    example: 'Rute Sukajaya - Megamendung menggunakan pick-up armada A',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'routeNotes harus berupa teks' })
  routeNotes?: string;
}

export class UpdateShipmentStatusDto {
  @ApiProperty({
    description: 'Status target pengiriman: PICKING_UP, IN_TRANSIT, ARRIVED, CANCELLED',
    example: 'IN_TRANSIT',
  })
  @IsString({ message: 'status harus berupa teks' })
  @IsNotEmpty({ message: 'status wajib diisi' })
  status!: string;

  @ApiProperty({
    description: 'Total susut bobot dalam kilogram (wajib diisi saat ARRIVED jika ada susut)',
    example: 0.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'lossKg harus berupa angka' })
  @Min(0, { message: 'lossKg tidak boleh negatif' })
  lossKg?: number;

  @ApiProperty({
    description: 'Alasan terjadinya susut selama perjalanan',
    example: 'Susut penguapan alami dan sortir daun patah selama perjalanan',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'lossReason harus berupa teks' })
  lossReason?: string;
}
