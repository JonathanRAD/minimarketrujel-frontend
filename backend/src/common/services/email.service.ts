import * as nodemailer from 'nodemailer';
import { env } from '../../config/env';
import dns from 'dns';

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.inicializarTransporter();
  }

  private inicializarTransporter() {
    const { userEmail, clientId, clientSecret, refreshToken } = env.gmail;

    if (!userEmail || !clientId || !clientSecret || !refreshToken) {
      console.warn(
        '⚠️  Servicio de Email (Gmail OAuth2) desactivado debido a que faltan credenciales en el archivo .env.'
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        // Forzar la resolución a IPv4 ya que Render no soporta ruteo IPv6 saliente para SMTP y falla con ENETUNREACH
        lookup: (hostname: string, options: any, callback: any) => {
          const opts = typeof options === 'number' ? { family: 4 } : { ...options, family: 4 };
          dns.lookup(hostname, opts as any, callback);
        },
        auth: {
          type: 'OAuth2',
          user: userEmail,
          clientId: clientId,
          clientSecret: clientSecret,
          refreshToken: refreshToken,
        },
      } as any);
      console.log('✉️  Servicio de Email (Gmail OAuth2) inicializado correctamente.');
    } catch (error) {
      console.error('❌ Error al inicializar el transporte de nodemailer:', error);
    }
  }

  /**
   * Envía un correo con el comprobante de venta formateado en HTML al administrador.
   * @param venta Objeto Venta completo con detalles (incluyendo producto), usuario y cliente (si existe).
   */
  async enviarComprobante(venta: any): Promise<void> {
    // Si no está inicializado, reintentar (por si se agregaron las credenciales en caliente)
    if (!this.transporter) {
      this.inicializarTransporter();
      if (!this.transporter) {
        // Si sigue sin estar inicializado, abortar silenciosamente
        return;
      }
    }

    const { adminRecipient, userEmail } = env.gmail;
    const destinatario = adminRecipient || userEmail;

    if (!destinatario) {
      console.error('❌ Error de email: No hay un correo destinatario (GMAIL_ADMIN_RECIPIENT) configurado.');
      return;
    }

    const fechaFormateada = new Date(venta.fecha).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const total = Number(venta.total).toFixed(2);
    const metodoPago = venta.metodoPago;
    const estado = venta.estado;

    // Determinar si etiquetarlo como boleta, factura o ticket de venta genérico
    const tipoComprobante = venta.clienteId ? 'COMPROBANTE DE VENTA' : 'TICKET DE VENTA';

    // Generar las filas del detalle
    let filasDetalleHtml = '';
    for (const detalle of venta.detalles) {
      const productoNombre = escapeHtml(detalle.producto?.nombre || 'Producto Desconocido');
      const cantidad = Number(detalle.cantidad);
      const precioUnitario = Number(detalle.precioUnitario).toFixed(2);
      const subtotal = Number(detalle.subtotal).toFixed(2);

      filasDetalleHtml += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; text-align: left; color: #334155; font-size: 14px;">
            <strong>${productoNombre}</strong>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #475569; font-size: 14px;">
            ${cantidad}
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #475569; font-size: 14px;">
            S/ ${precioUnitario}
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #0f172a; font-size: 14px; font-weight: 600;">
            S/ ${subtotal}
          </td>
        </tr>
      `;
    }

    // Datos del cliente
    let clienteHtml = '';
    if (venta.cliente) {
      clienteHtml = `
        <div style="margin-top: 15px; padding: 12px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
          <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">Cliente</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">${escapeHtml(venta.cliente.nombre)}</p>
          ${venta.cliente.telefono ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #475569;">📞 Tel: ${escapeHtml(venta.cliente.telefono)}</p>` : ''}
          ${venta.cliente.direccion ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #475569;">📍 Dir: ${escapeHtml(venta.cliente.direccion)}</p>` : ''}
        </div>
      `;
    }

    const cajeroNombre = escapeHtml(venta.usuario?.nombre || 'Cajero');

    const prefijo = estado === 'ANULADA' ? '⚠️ [ANULACIÓN]' : '✅ [COMPROBANTE]';
    const subject = `${prefijo} ${tipoComprobante} #${venta.id.substring(0, 8)} - S/ ${total}`;

    const mailOptions = {
      from: `"Minimarket POS" <${userEmail}>`,
      to: destinatario,
      subject,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tipoComprobante}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;-webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Caja Principal -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; border-top: 6px solid #4f46e5;">
          
          <!-- Cabecera -->
          <tr>
            <td style="padding: 24px 30px; background-color: #4f46e5; text-align: center; color: #ffffff;">
              <h1 style="margin: 0 0 5px 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em;">MINIMARKET POS</h1>
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Notificación Automática de Transacción</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 30px;">
              <!-- ID Venta y Estado -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td>
                    <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">${tipoComprobante}</span>
                    <h2 style="margin: 2px 0 0 0; font-size: 18px; color: #0f172a; font-weight: 800;">ID: #${venta.id}</h2>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <span style="display: inline-block; padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; ${
                      estado === 'COMPLETADA'
                        ? 'background-color: #dcfce7; color: #15803d;'
                        : 'background-color: #fee2e2; color: #b91c1c;'
                    }">
                      ${estado}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Metadata General -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #475569;">
                    <strong>Fecha y Hora:</strong> ${fechaFormateada}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #475569;">
                    <strong>Cajero:</strong> ${cajeroNombre}
                  </td>
                </tr>
              </table>

              <!-- Cliente -->
              ${clienteHtml}

              <!-- Tabla de Detalles -->
              <h3 style="margin: 25px 0 10px 0; font-size: 15px; color: #0f172a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Detalle de la Venta</h3>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Producto</th>
                    <th style="padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; width: 60px;">Cant.</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; width: 100px;">P. Unit.</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; width: 100px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasDetalleHtml}
                </tbody>
              </table>

              <!-- Desglose Financiero -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #475569;">
                    Método de Pago:
                  </td>
                  <td align="right" style="padding: 4px 0; font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase;">
                    ${metodoPago}
                  </td>
                </tr>
                ${
                  metodoPago === 'MIXTO'
                    ? `
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #64748b; padding-left: 15px;">
                      Efectivo:
                    </td>
                    <td align="right" style="padding: 4px 0; font-size: 13px; color: #475569;">
                      S/ ${Number(venta.montoEfectivo).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #64748b; padding-left: 15px;">
                      Tarjeta:
                    </td>
                    <td align="right" style="padding: 4px 0; font-size: 13px; color: #475569;">
                      S/ ${Number(venta.montoTarjeta).toFixed(2)}
                    </td>
                  </tr>
                `
                    : ''
                }
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                    TOTAL:
                  </td>
                  <td align="right" style="padding: 10px 0 0 0; font-size: 20px; font-weight: 800; color: #4f46e5;">
                    S/ ${total}
                  </td>
                </tr>
              </table>

              <!-- Mensaje de estado anulado -->
              ${
                estado === 'ANULADA'
                  ? `
                <div style="margin-top: 15px; padding: 12px; background-color: #fee2e2; border-radius: 8px; border: 1px solid #fecaca; text-align: center;">
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #b91c1c; text-transform: uppercase;">Esta venta ha sido ANULADA en el sistema.</p>
                </div>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
              Este es un correo automático del sistema Minimarket POS. Por favor no respondas a este mensaje.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Correo enviado con éxito a ${destinatario}. ID Mensaje: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ Error al enviar el comprobante de venta por correo a ${destinatario}:`, error);
    }
  }

  /**
   * Envía una alerta al correo del administrador detallando qué productos
   * han caído por debajo del stock mínimo configurado.
   * @param productos Lista de productos con stock crítico.
   */
  async enviarAlertaStock(productos: any[]): Promise<void> {
    if (!this.transporter) {
      this.inicializarTransporter();
      if (!this.transporter) {
        return;
      }
    }

    const { adminRecipient, userEmail } = env.gmail;
    const destinatario = adminRecipient || userEmail;

    if (!destinatario) {
      console.error('❌ Error de email: No hay un correo destinatario para alertas configurado.');
      return;
    }

    let filasProductosHtml = '';
    for (const prod of productos) {
      const nombreEscapado = escapeHtml(prod.nombre);
      const codigoEscapado = escapeHtml(prod.codigoBarras);
      filasProductosHtml += `
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 12px; text-align: left; color: #7f1d1d; font-size: 14px; font-weight: 600;">
            ${nombreEscapado}<br>
            <span style="font-size: 11px; color: #b91c1c; font-weight: normal;">Cod: ${codigoEscapado}</span>
          </td>
          <td style="padding: 12px; text-align: center; color: #b91c1c; font-size: 14px; font-weight: 700; background-color: #fee2e2;">
            ${prod.stockActual} ${prod.unidadMedida.toLowerCase()}
          </td>
          <td style="padding: 12px; text-align: center; color: #4b5563; font-size: 14px;">
            ${prod.stockMinimo} ${prod.unidadMedida.toLowerCase()}
          </td>
        </tr>
      `;
    }

    const mailOptions = {
      from: `"Minimarket POS" <${userEmail}>`,
      to: destinatario,
      subject: `⚠️ [ALERTA DE STOCK] ${productos.length} producto(s) por debajo del stock mínimo`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Alerta de Inventario</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fcf8f8; color: #1e293b;-webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #fcf8f8; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Caja Principal -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden; border-top: 6px solid #ef4444;">
          
          <!-- Cabecera -->
          <tr>
            <td style="padding: 24px 30px; background-color: #ef4444; text-align: center; color: #ffffff;">
              <h1 style="margin: 0 0 5px 0; font-size: 22px; font-weight: 800; letter-spacing: 0.05em;">🚨 ALERTA DE STOCK MÍNIMO</h1>
              <p style="margin: 0; font-size: 13px; opacity: 0.9;">Es necesario reabastecer el inventario de los siguientes productos</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">
                Estimado Administrador,<br>
                El sistema de facturación POS ha detectado que los siguientes productos han caído por debajo del stock mínimo configurado tras la última venta registrada:
              </p>

              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #fef2f2; border-bottom: 2px solid #fca5a5;">
                    <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Producto / Código</th>
                    <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; width: 120px;">Stock Actual</th>
                    <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; width: 120px;">Stock Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasProductosHtml}
                </tbody>
              </table>

              <div style="background-color: #fffbeb; border-radius: 8px; padding: 15px; border-left: 4px solid #d97706; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5; font-weight: 500;">
                  ⚠️ <strong>Recomendación:</strong> Por favor, póngase en contacto con sus proveedores habituales para coordinar el reabastecimiento de estos artículos y prevenir desabastecimientos de góndola.
                </p>
              </div>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb; color: #94a3b8; font-size: 11px;">
              Este es un correo de alerta automatizado generado por su Sistema Minimarket POS.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Alerta de stock mínimo enviada con éxito a ${destinatario}. ID Mensaje: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ Error al enviar la alerta de stock mínimo a ${destinatario}:`, error);
    }
  }
}

export const emailService = new EmailService();
