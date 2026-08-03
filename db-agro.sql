--
-- PostgreSQL database dump
--

\restrict 0ZhEOzRd7jAKdNyeRo3AL7LcaVOcikxyaQFJ0Cs778VCFQHWIqrvIraT7CQt73I

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

-- Started on 2026-07-28 16:18:59

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 24753)
-- Name: administrador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administrador (
    id_administrador integer NOT NULL,
    id_usuario integer NOT NULL,
    permisos text
);


ALTER TABLE public.administrador OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24752)
-- Name: administrador_id_administrador_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.administrador_id_administrador_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.administrador_id_administrador_seq OWNER TO postgres;

--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 219
-- Name: administrador_id_administrador_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.administrador_id_administrador_seq OWNED BY public.administrador.id_administrador;


--
-- TOC entry 272 (class 1259 OID 33372)
-- Name: asociaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asociaciones (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    subdominio character varying(60) NOT NULL,
    email_contacto character varying(150),
    telefono character varying(30),
    direccion text,
    logo_url text,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    CONSTRAINT asociaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying, 'SUSPENDIDO'::character varying])::text[])))
);


ALTER TABLE public.asociaciones OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 33371)
-- Name: asociaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asociaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asociaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 271
-- Name: asociaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asociaciones_id_seq OWNED BY public.asociaciones.id;


--
-- TOC entry 248 (class 1259 OID 24977)
-- Name: codigo_qr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.codigo_qr (
    id_qr integer NOT NULL,
    id_producto integer NOT NULL,
    id_productor integer NOT NULL,
    codigo_qr character varying(255) NOT NULL,
    fecha_generacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true
);


ALTER TABLE public.codigo_qr OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 24976)
-- Name: codigo_qr_id_qr_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.codigo_qr_id_qr_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codigo_qr_id_qr_seq OWNER TO postgres;

--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 247
-- Name: codigo_qr_id_qr_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.codigo_qr_id_qr_seq OWNED BY public.codigo_qr.id_qr;


--
-- TOC entry 260 (class 1259 OID 25079)
-- Name: comerciante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comerciante (
    id_comerciante integer NOT NULL,
    nombre character varying(100) NOT NULL,
    telefono character varying(20) NOT NULL,
    direccion character varying(150),
    activo boolean DEFAULT true,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(150) DEFAULT NULL::character varying,
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.comerciante OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 25078)
-- Name: comerciante_id_comerciante_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comerciante_id_comerciante_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comerciante_id_comerciante_seq OWNER TO postgres;

--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 259
-- Name: comerciante_id_comerciante_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comerciante_id_comerciante_seq OWNED BY public.comerciante.id_comerciante;


--
-- TOC entry 238 (class 1259 OID 24890)
-- Name: compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compra (
    id_compra integer NOT NULL,
    id_operario integer NOT NULL,
    id_productor integer NOT NULL,
    fecha_compra date NOT NULL,
    total numeric(12,2) NOT NULL,
    estado character varying(50) DEFAULT 'pendiente'::character varying,
    numero_factura character varying(50),
    activo boolean DEFAULT true,
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.compra OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 24889)
-- Name: compra_id_compra_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compra_id_compra_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compra_id_compra_seq OWNER TO postgres;

--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 237
-- Name: compra_id_compra_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compra_id_compra_seq OWNED BY public.compra.id_compra;


--
-- TOC entry 252 (class 1259 OID 25014)
-- Name: confirmacion_ruta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.confirmacion_ruta (
    id_confirmacion integer NOT NULL,
    id_ruta integer NOT NULL,
    fecha_confirmacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    confirmado_por character varying(150),
    observaciones text
);


ALTER TABLE public.confirmacion_ruta OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 25013)
-- Name: confirmacion_ruta_id_confirmacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.confirmacion_ruta_id_confirmacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.confirmacion_ruta_id_confirmacion_seq OWNER TO postgres;

--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 251
-- Name: confirmacion_ruta_id_confirmacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.confirmacion_ruta_id_confirmacion_seq OWNED BY public.confirmacion_ruta.id_confirmacion;


--
-- TOC entry 240 (class 1259 OID 24910)
-- Name: detalle_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_compra (
    id_detalle_compra integer NOT NULL,
    id_compra integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.detalle_compra OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 24909)
-- Name: detalle_compra_id_detalle_compra_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_compra_id_detalle_compra_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_compra_id_detalle_compra_seq OWNER TO postgres;

--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 239
-- Name: detalle_compra_id_detalle_compra_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_compra_id_detalle_compra_seq OWNED BY public.detalle_compra.id_detalle_compra;


--
-- TOC entry 244 (class 1259 OID 24942)
-- Name: detalle_venta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_venta (
    id_detalle_venta integer NOT NULL,
    id_venta integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.detalle_venta OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 24941)
-- Name: detalle_venta_id_detalle_venta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_venta_id_detalle_venta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_venta_id_detalle_venta_seq OWNER TO postgres;

--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 243
-- Name: detalle_venta_id_detalle_venta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_venta_id_detalle_venta_seq OWNED BY public.detalle_venta.id_detalle_venta;


--
-- TOC entry 262 (class 1259 OID 25093)
-- Name: entrega; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entrega (
    id_entrega integer NOT NULL,
    id_operario integer NOT NULL,
    id_productor integer,
    id_producto integer,
    peso_kg numeric(10,2) DEFAULT 0,
    cantidad_unidades integer DEFAULT 0,
    precio_unitario numeric(10,2) DEFAULT NULL::numeric,
    total numeric(12,2) DEFAULT NULL::numeric,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'COMPLETADA'::character varying,
    comprobante_pago text,
    estado_pago character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    fecha_pago timestamp without time zone,
    ruta_id integer,
    estado_liquidacion character varying(30) DEFAULT 'PENDIENTE_LIQUIDACION'::character varying NOT NULL,
    tipo_productor character varying(10) DEFAULT 'AFILIADO'::character varying NOT NULL,
    nombre_productor_externo character varying(150),
    telefono_productor_externo character varying(30),
    nombre_producto_otro character varying(150),
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.entrega OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 25092)
-- Name: entrega_id_entrega_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entrega_id_entrega_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entrega_id_entrega_seq OWNER TO postgres;

--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 261
-- Name: entrega_id_entrega_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entrega_id_entrega_seq OWNED BY public.entrega.id_entrega;


--
-- TOC entry 230 (class 1259 OID 24834)
-- Name: historial_precio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_precio (
    id_historial_precio integer NOT NULL,
    id_producto integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    motivo character varying(255)
);


ALTER TABLE public.historial_precio OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24833)
-- Name: historial_precio_id_historial_precio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_precio_id_historial_precio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_precio_id_historial_precio_seq OWNER TO postgres;

--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 229
-- Name: historial_precio_id_historial_precio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_precio_id_historial_precio_seq OWNED BY public.historial_precio.id_historial_precio;


--
-- TOC entry 246 (class 1259 OID 24959)
-- Name: historial_transaccion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_transaccion (
    id_historial integer NOT NULL,
    id_compra integer,
    id_venta integer,
    tipo_transaccion character varying(50) NOT NULL,
    fecha_transaccion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    monto numeric(12,2) NOT NULL,
    estado character varying(50)
);


ALTER TABLE public.historial_transaccion OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 24958)
-- Name: historial_transaccion_id_historial_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_transaccion_id_historial_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_transaccion_id_historial_seq OWNER TO postgres;

--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 245
-- Name: historial_transaccion_id_historial_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_transaccion_id_historial_seq OWNED BY public.historial_transaccion.id_historial;


--
-- TOC entry 258 (class 1259 OID 25056)
-- Name: modo_offline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modo_offline (
    id_offline integer NOT NULL,
    id_operario integer NOT NULL,
    datos_cache bytea,
    fecha_sincronizacion timestamp without time zone,
    sincronizado boolean DEFAULT false
);


ALTER TABLE public.modo_offline OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 25055)
-- Name: modo_offline_id_offline_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modo_offline_id_offline_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modo_offline_id_offline_seq OWNER TO postgres;

--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 257
-- Name: modo_offline_id_offline_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modo_offline_id_offline_seq OWNED BY public.modo_offline.id_offline;


--
-- TOC entry 222 (class 1259 OID 24769)
-- Name: operario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operario (
    id_operario integer NOT NULL,
    id_usuario integer NOT NULL,
    area_trabajo character varying(100)
);


ALTER TABLE public.operario OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24768)
-- Name: operario_id_operario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operario_id_operario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operario_id_operario_seq OWNER TO postgres;

--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 221
-- Name: operario_id_operario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operario_id_operario_seq OWNED BY public.operario.id_operario;


--
-- TOC entry 226 (class 1259 OID 24801)
-- Name: perfil_productor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.perfil_productor (
    id_perfil integer NOT NULL,
    id_productor integer NOT NULL,
    biografia text,
    foto_url character varying(255),
    certificaciones text,
    premios text,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.perfil_productor OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24800)
-- Name: perfil_productor_id_perfil_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.perfil_productor_id_perfil_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.perfil_productor_id_perfil_seq OWNER TO postgres;

--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 225
-- Name: perfil_productor_id_perfil_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.perfil_productor_id_perfil_seq OWNED BY public.perfil_productor.id_perfil;


--
-- TOC entry 264 (class 1259 OID 33269)
-- Name: precios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.precios (
    id_precio integer NOT NULL,
    id_producto integer NOT NULL,
    precio_base_kg numeric(12,2) NOT NULL,
    precio_transporte numeric(12,2) DEFAULT 0 NOT NULL,
    total_kilos numeric(12,2) NOT NULL,
    costo_transporte_kg numeric(12,4) NOT NULL,
    precio_final_kg numeric(12,2) NOT NULL,
    margen_asociacion numeric(5,4) DEFAULT 0.035 NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.precios OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 33268)
-- Name: precios_id_precio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.precios_id_precio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.precios_id_precio_seq OWNER TO postgres;

--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 263
-- Name: precios_id_precio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.precios_id_precio_seq OWNED BY public.precios.id_precio;


--
-- TOC entry 232 (class 1259 OID 24847)
-- Name: produccion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produccion (
    id_produccion integer NOT NULL,
    id_productor integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(20) NOT NULL,
    fecha_produccion date NOT NULL,
    fecha_cosecha date,
    lote character varying(50),
    estado character varying(50) DEFAULT 'planificada'::character varying
);


ALTER TABLE public.produccion OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24846)
-- Name: produccion_id_produccion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.produccion_id_produccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.produccion_id_produccion_seq OWNER TO postgres;

--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 231
-- Name: produccion_id_produccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.produccion_id_produccion_seq OWNED BY public.produccion.id_produccion;


--
-- TOC entry 228 (class 1259 OID 24818)
-- Name: producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto (
    id_producto integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    unidad_medida character varying(20) NOT NULL,
    precio_base numeric(10,2) NOT NULL,
    disponible boolean DEFAULT true,
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.producto OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24817)
-- Name: producto_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_id_producto_seq OWNER TO postgres;

--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 227
-- Name: producto_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_id_producto_seq OWNED BY public.producto.id_producto;


--
-- TOC entry 224 (class 1259 OID 24783)
-- Name: productor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productor (
    id_productor integer NOT NULL,
    id_usuario integer NOT NULL,
    finca character varying(150),
    ubicacion character varying(255),
    tipo_certificacion character varying(100),
    codigo_qr text,
    cedula character varying(50),
    telefono character varying(50),
    estado character varying(20) DEFAULT 'ACTIVO'::character varying,
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.productor OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24782)
-- Name: productor_id_productor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productor_id_productor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productor_id_productor_seq OWNER TO postgres;

--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 223
-- Name: productor_id_productor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productor_id_productor_seq OWNED BY public.productor.id_productor;


--
-- TOC entry 234 (class 1259 OID 24865)
-- Name: proyeccion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proyeccion (
    id_proyeccion integer NOT NULL,
    id_produccion integer NOT NULL,
    cantidad_proyectada numeric(10,2) NOT NULL,
    fecha_proyeccion date NOT NULL,
    metodo_calculo character varying(100)
);


ALTER TABLE public.proyeccion OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 24864)
-- Name: proyeccion_id_proyeccion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proyeccion_id_proyeccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proyeccion_id_proyeccion_seq OWNER TO postgres;

--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 233
-- Name: proyeccion_id_proyeccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyeccion_id_proyeccion_seq OWNED BY public.proyeccion.id_proyeccion;


--
-- TOC entry 256 (class 1259 OID 25044)
-- Name: ranking_productor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ranking_productor (
    id_ranking integer NOT NULL,
    id_productor integer NOT NULL,
    posicion integer NOT NULL,
    puntuacion numeric(5,2) NOT NULL,
    criterio character varying(100),
    periodo date NOT NULL
);


ALTER TABLE public.ranking_productor OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 25043)
-- Name: ranking_productor_id_ranking_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ranking_productor_id_ranking_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ranking_productor_id_ranking_seq OWNER TO postgres;

--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 255
-- Name: ranking_productor_id_ranking_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ranking_productor_id_ranking_seq OWNED BY public.ranking_productor.id_ranking;


--
-- TOC entry 254 (class 1259 OID 25029)
-- Name: reporte; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reporte (
    id_reporte integer NOT NULL,
    id_administrador integer NOT NULL,
    tipo_reporte character varying(100) NOT NULL,
    fecha_generacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parametros text,
    archivo_url character varying(255)
);


ALTER TABLE public.reporte OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 25028)
-- Name: reporte_id_reporte_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reporte_id_reporte_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reporte_id_reporte_seq OWNER TO postgres;

--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 253
-- Name: reporte_id_reporte_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reporte_id_reporte_seq OWNED BY public.reporte.id_reporte;


--
-- TOC entry 266 (class 1259 OID 33292)
-- Name: ruta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ruta (
    id_ruta integer NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    estado character varying(20) DEFAULT 'ABIERTA'::character varying NOT NULL,
    flete numeric(12,2) DEFAULT NULL::numeric,
    total_kilos numeric(12,2) DEFAULT NULL::numeric,
    precio_base_kg_snapshot numeric(12,2) DEFAULT NULL::numeric,
    precio_final_kg numeric(12,2) DEFAULT NULL::numeric,
    id_producto integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    id_operario integer
);


ALTER TABLE public.ruta OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 33291)
-- Name: ruta_id_ruta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ruta_id_ruta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ruta_id_ruta_seq OWNER TO postgres;

--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 265
-- Name: ruta_id_ruta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ruta_id_ruta_seq OWNED BY public.ruta.id_ruta;


--
-- TOC entry 250 (class 1259 OID 24998)
-- Name: ruta_planificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ruta_planificacion (
    id_ruta integer NOT NULL,
    id_productor integer NOT NULL,
    origen character varying(255) NOT NULL,
    destino character varying(255) NOT NULL,
    fecha_planificada date NOT NULL,
    estado character varying(50) DEFAULT 'planificada'::character varying,
    distancia_km numeric(8,2),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ruta_planificacion OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 24997)
-- Name: ruta_planificacion_id_ruta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ruta_planificacion_id_ruta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ruta_planificacion_id_ruta_seq OWNER TO postgres;

--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 249
-- Name: ruta_planificacion_id_ruta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ruta_planificacion_id_ruta_seq OWNED BY public.ruta_planificacion.id_ruta;


--
-- TOC entry 218 (class 1259 OID 24738)
-- Name: sesion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesion (
    id_sesion integer NOT NULL,
    id_usuario integer NOT NULL,
    fecha_inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_fin timestamp without time zone,
    token character varying(255)
);


ALTER TABLE public.sesion OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 24737)
-- Name: sesion_id_sesion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sesion_id_sesion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sesion_id_sesion_seq OWNER TO postgres;

--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 217
-- Name: sesion_id_sesion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sesion_id_sesion_seq OWNED BY public.sesion.id_sesion;


--
-- TOC entry 268 (class 1259 OID 33331)
-- Name: stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock (
    id_stock integer NOT NULL,
    id_producto integer NOT NULL,
    kilos_disponibles numeric(12,2) DEFAULT 0 NOT NULL,
    kilos_acumulados numeric(12,2) DEFAULT 0 NOT NULL,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stock OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 33330)
-- Name: stock_id_stock_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_id_stock_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_id_stock_seq OWNER TO postgres;

--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 267
-- Name: stock_id_stock_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_id_stock_seq OWNED BY public.stock.id_stock;


--
-- TOC entry 270 (class 1259 OID 33348)
-- Name: stock_movimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movimiento (
    id_movimiento integer NOT NULL,
    id_producto integer NOT NULL,
    tipo character varying(10) NOT NULL,
    kilos numeric(12,2) NOT NULL,
    referencia_id integer,
    referencia_tipo character varying(20),
    descripcion text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stock_movimiento_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ENTRADA'::character varying, 'SALIDA'::character varying])::text[])))
);


ALTER TABLE public.stock_movimiento OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 33347)
-- Name: stock_movimiento_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stock_movimiento_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_movimiento_id_movimiento_seq OWNER TO postgres;

--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 269
-- Name: stock_movimiento_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stock_movimiento_id_movimiento_seq OWNED BY public.stock_movimiento.id_movimiento;


--
-- TOC entry 236 (class 1259 OID 24877)
-- Name: tendencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tendencia (
    id_tendencia integer NOT NULL,
    id_proyeccion integer NOT NULL,
    tipo_tendencia character varying(50) NOT NULL,
    porcentaje_variacion numeric(5,2),
    grafico_url character varying(255),
    fecha_analisis timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tendencia OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 24876)
-- Name: tendencia_id_tendencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tendencia_id_tendencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tendencia_id_tendencia_seq OWNER TO postgres;

--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 235
-- Name: tendencia_id_tendencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tendencia_id_tendencia_seq OWNED BY public.tendencia.id_tendencia;


--
-- TOC entry 216 (class 1259 OID 24725)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    telefono character varying(20),
    tipo_usuario character varying(50) NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true,
    cedula character varying(20),
    permisos character varying(50),
    foto_perfil character varying(255),
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 24724)
-- Name: usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 215
-- Name: usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_usuario_seq OWNED BY public.usuario.id_usuario;


--
-- TOC entry 273 (class 1259 OID 33443)
-- Name: v_resumen_tenant; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_resumen_tenant AS
 SELECT a.id AS asociacion_id,
    a.nombre,
    a.subdominio,
    a.estado,
    count(DISTINCT u.id_usuario) AS total_usuarios,
    count(DISTINCT p.id_productor) AS total_productores,
    count(DISTINCT e.id_entrega) AS total_entregas
   FROM (((public.asociaciones a
     LEFT JOIN public.usuario u ON ((u.asociacion_id = a.id)))
     LEFT JOIN public.productor p ON ((p.asociacion_id = a.id)))
     LEFT JOIN public.entrega e ON ((e.asociacion_id = a.id)))
  GROUP BY a.id, a.nombre, a.subdominio, a.estado;


ALTER VIEW public.v_resumen_tenant OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 24927)
-- Name: venta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venta (
    id_venta integer NOT NULL,
    id_operario integer NOT NULL,
    fecha_venta date NOT NULL,
    cliente character varying(150) NOT NULL,
    total numeric(12,2) NOT NULL,
    estado character varying(50) DEFAULT 'pendiente'::character varying,
    numero_factura character varying(50),
    activo boolean DEFAULT true,
    id_comerciante integer,
    asociacion_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.venta OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 24926)
-- Name: venta_id_venta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.venta_id_venta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.venta_id_venta_seq OWNER TO postgres;

--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 241
-- Name: venta_id_venta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.venta_id_venta_seq OWNED BY public.venta.id_venta;


--
-- TOC entry 4885 (class 2604 OID 24756)
-- Name: administrador id_administrador; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador ALTER COLUMN id_administrador SET DEFAULT nextval('public.administrador_id_administrador_seq'::regclass);


--
-- TOC entry 4963 (class 2604 OID 33375)
-- Name: asociaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asociaciones ALTER COLUMN id SET DEFAULT nextval('public.asociaciones_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 24980)
-- Name: codigo_qr id_qr; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_qr ALTER COLUMN id_qr SET DEFAULT nextval('public.codigo_qr_id_qr_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 25082)
-- Name: comerciante id_comerciante; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciante ALTER COLUMN id_comerciante SET DEFAULT nextval('public.comerciante_id_comerciante_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 24893)
-- Name: compra id_compra; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra ALTER COLUMN id_compra SET DEFAULT nextval('public.compra_id_compra_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 25017)
-- Name: confirmacion_ruta id_confirmacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.confirmacion_ruta ALTER COLUMN id_confirmacion SET DEFAULT nextval('public.confirmacion_ruta_id_confirmacion_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 24913)
-- Name: detalle_compra id_detalle_compra; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra ALTER COLUMN id_detalle_compra SET DEFAULT nextval('public.detalle_compra_id_detalle_compra_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 24945)
-- Name: detalle_venta id_detalle_venta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta ALTER COLUMN id_detalle_venta SET DEFAULT nextval('public.detalle_venta_id_detalle_venta_seq'::regclass);


--
-- TOC entry 4932 (class 2604 OID 25096)
-- Name: entrega id_entrega; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega ALTER COLUMN id_entrega SET DEFAULT nextval('public.entrega_id_entrega_seq'::regclass);


--
-- TOC entry 4895 (class 2604 OID 24837)
-- Name: historial_precio id_historial_precio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precio ALTER COLUMN id_historial_precio SET DEFAULT nextval('public.historial_precio_id_historial_precio_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 24962)
-- Name: historial_transaccion id_historial; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_transaccion ALTER COLUMN id_historial SET DEFAULT nextval('public.historial_transaccion_id_historial_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 25059)
-- Name: modo_offline id_offline; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modo_offline ALTER COLUMN id_offline SET DEFAULT nextval('public.modo_offline_id_offline_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 24772)
-- Name: operario id_operario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operario ALTER COLUMN id_operario SET DEFAULT nextval('public.operario_id_operario_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 24804)
-- Name: perfil_productor id_perfil; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_productor ALTER COLUMN id_perfil SET DEFAULT nextval('public.perfil_productor_id_perfil_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 33272)
-- Name: precios id_precio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precios ALTER COLUMN id_precio SET DEFAULT nextval('public.precios_id_precio_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 24850)
-- Name: produccion id_produccion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion ALTER COLUMN id_produccion SET DEFAULT nextval('public.produccion_id_produccion_seq'::regclass);


--
-- TOC entry 4892 (class 2604 OID 24821)
-- Name: producto id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto ALTER COLUMN id_producto SET DEFAULT nextval('public.producto_id_producto_seq'::regclass);


--
-- TOC entry 4887 (class 2604 OID 24786)
-- Name: productor id_productor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productor ALTER COLUMN id_productor SET DEFAULT nextval('public.productor_id_productor_seq'::regclass);


--
-- TOC entry 4899 (class 2604 OID 24868)
-- Name: proyeccion id_proyeccion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyeccion ALTER COLUMN id_proyeccion SET DEFAULT nextval('public.proyeccion_id_proyeccion_seq'::regclass);


--
-- TOC entry 4924 (class 2604 OID 25047)
-- Name: ranking_productor id_ranking; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_productor ALTER COLUMN id_ranking SET DEFAULT nextval('public.ranking_productor_id_ranking_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 25032)
-- Name: reporte id_reporte; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporte ALTER COLUMN id_reporte SET DEFAULT nextval('public.reporte_id_reporte_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 33295)
-- Name: ruta id_ruta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta ALTER COLUMN id_ruta SET DEFAULT nextval('public.ruta_id_ruta_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 25001)
-- Name: ruta_planificacion id_ruta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta_planificacion ALTER COLUMN id_ruta SET DEFAULT nextval('public.ruta_planificacion_id_ruta_seq'::regclass);


--
-- TOC entry 4883 (class 2604 OID 24741)
-- Name: sesion id_sesion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion ALTER COLUMN id_sesion SET DEFAULT nextval('public.sesion_id_sesion_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 33334)
-- Name: stock id_stock; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock ALTER COLUMN id_stock SET DEFAULT nextval('public.stock_id_stock_seq'::regclass);


--
-- TOC entry 4961 (class 2604 OID 33351)
-- Name: stock_movimiento id_movimiento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movimiento ALTER COLUMN id_movimiento SET DEFAULT nextval('public.stock_movimiento_id_movimiento_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 24880)
-- Name: tendencia id_tendencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tendencia ALTER COLUMN id_tendencia SET DEFAULT nextval('public.tendencia_id_tendencia_seq'::regclass);


--
-- TOC entry 4879 (class 2604 OID 24728)
-- Name: usuario id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuario_id_usuario_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 24930)
-- Name: venta id_venta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta ALTER COLUMN id_venta SET DEFAULT nextval('public.venta_id_venta_seq'::regclass);


--
-- TOC entry 5261 (class 0 OID 24753)
-- Dependencies: 220
-- Data for Name: administrador; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.administrador (id_administrador, id_usuario, permisos) FROM stdin;
\.


--
-- TOC entry 5313 (class 0 OID 33372)
-- Dependencies: 272
-- Data for Name: asociaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asociaciones (id, nombre, subdominio, email_contacto, telefono, direccion, logo_url, fecha_creacion, estado) FROM stdin;
1	Asociación Agrícola Uno	asoc1	admin@asoc1.com	\N	\N	\N	2026-03-29 22:03:18.095526-05	ACTIVO
2	Asociación Agrícola Dos	asoc2	admin@asoc2.com	\N	\N	\N	2026-03-29 22:03:18.095526-05	ACTIVO
3	Asociación Agrícola Tres	asoc3	admin@asoc3.com	\N	\N	\N	2026-03-29 22:03:18.095526-05	ACTIVO
4	Asociación Principal	localhost	admin@agrotrace.com	\N	\N	\N	2026-03-30 10:15:01.595443-05	ACTIVO
\.


--
-- TOC entry 5289 (class 0 OID 24977)
-- Dependencies: 248
-- Data for Name: codigo_qr; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.codigo_qr (id_qr, id_producto, id_productor, codigo_qr, fecha_generacion, activo) FROM stdin;
\.


--
-- TOC entry 5301 (class 0 OID 25079)
-- Dependencies: 260
-- Data for Name: comerciante; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comerciante (id_comerciante, nombre, telefono, direccion, activo, fecha_registro, email, asociacion_id) FROM stdin;
2	Galeria	3112365741	Belen de los andquiesss	t	2026-03-21 17:08:29.504698	ingrijuliethgascatenorio@gmail.com	1
1	El primo	3124567890	Florencia Caquetá	t	2026-03-17 08:49:37.493444	yuleinylugo71@gmail.com	1
\.


--
-- TOC entry 5279 (class 0 OID 24890)
-- Dependencies: 238
-- Data for Name: compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compra (id_compra, id_operario, id_productor, fecha_compra, total, estado, numero_factura, activo, asociacion_id) FROM stdin;
3	1	2	2026-03-11	150000.00	completada	FC-1001	t	1
\.


--
-- TOC entry 5293 (class 0 OID 25014)
-- Dependencies: 252
-- Data for Name: confirmacion_ruta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.confirmacion_ruta (id_confirmacion, id_ruta, fecha_confirmacion, confirmado_por, observaciones) FROM stdin;
\.


--
-- TOC entry 5281 (class 0 OID 24910)
-- Dependencies: 240
-- Data for Name: detalle_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_compra (id_detalle_compra, id_compra, id_producto, cantidad, precio_unitario, subtotal) FROM stdin;
5	3	2	10.00	5000.00	50000.00
6	3	3	20.00	2500.00	50000.00
\.


--
-- TOC entry 5285 (class 0 OID 24942)
-- Dependencies: 244
-- Data for Name: detalle_venta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_venta (id_detalle_venta, id_venta, id_producto, cantidad, precio_unitario, subtotal) FROM stdin;
1	2	4	5.00	5000.00	25000.00
2	2	3	10.00	2500.00	25000.00
3	74	3	23.00	2100.00	48300.00
4	75	3	23.00	2100.00	48300.00
5	76	3	54.00	2100.00	113400.00
6	77	3	800.00	2000.00	1600000.00
7	83	3	1200.00	2000.00	2400000.00
8	84	2	100.00	1600.00	160000.00
9	85	2	64.00	1600.00	102400.00
10	86	4	50.00	3200.00	160000.00
11	87	3	23.00	2100.00	48300.00
12	95	4	22.00	3200.00	70400.00
13	96	3	234.00	2100.00	491400.00
14	97	2	123.00	1800.00	221400.00
15	98	2	145.00	1900.00	275500.00
16	99	3	100.00	2200.00	220000.00
17	100	4	12.00	3200.00	38400.00
18	101	3	234.00	2200.00	514800.00
19	102	3	122.00	2200.00	268400.00
20	103	4	12.00	3200.00	38400.00
21	104	3	12.00	2200.00	26400.00
22	105	3	234.00	2200.00	514800.00
23	106	3	21.00	2200.00	46200.00
24	107	4	54.00	3200.00	172800.00
25	108	3	234.00	2200.00	514800.00
26	109	2	7.50	1900.00	14250.00
27	110	4	100.00	3200.00	320000.00
28	111	3	10.00	2200.00	22000.00
29	112	3	1200.00	2200.00	2640000.00
30	113	3	12.00	2200.00	26400.00
31	114	3	123.00	2200.00	270600.00
32	115	3	123.00	2200.00	270600.00
33	116	3	200.00	2200.00	440000.00
34	117	3	12.00	2200.00	26400.00
35	118	3	201.00	2200.00	442200.00
36	119	3	123.00	2200.00	270600.00
37	120	2	100.00	1900.00	190000.00
38	121	3	222.00	2200.00	488400.00
39	122	2	24.00	1800.00	43200.00
40	123	3	21.00	2100.00	44100.00
41	124	2	22.00	1800.00	39600.00
42	125	3	322.87	2200.00	710314.00
43	126	3	23.00	2200.00	50600.00
44	127	3	234.00	2100.00	491400.00
45	127	2	452.99	1800.00	815382.00
46	127	4	122.99	3100.00	381269.00
47	128	3	10000.00	2100.00	21000000.00
48	128	2	500.00	1800.00	900000.00
\.


--
-- TOC entry 5303 (class 0 OID 25093)
-- Dependencies: 262
-- Data for Name: entrega; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entrega (id_entrega, id_operario, id_productor, id_producto, peso_kg, cantidad_unidades, precio_unitario, total, fecha, estado, comprobante_pago, estado_pago, fecha_pago, ruta_id, estado_liquidacion, tipo_productor, nombre_productor_externo, telefono_productor_externo, nombre_producto_otro, asociacion_id) FROM stdin;
187	2	156	3	200.00	0	\N	\N	2026-04-27 21:51:18.936519	COMPLETADA	\N	PENDIENTE	\N	14	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
28	2	43	3	233.00	0	1928.78	449405.74	2026-04-07 16:08:36.030349	COMPLETADA	\N	PENDIENTE	\N	5	LIQUIDADO	AFILIADO	\N	\N	\N	1
30	2	18	4	210.00	0	1928.78	405043.80	2026-04-07 16:10:26.622045	COMPLETADA	\N	PENDIENTE	\N	5	LIQUIDADO	AFILIADO	\N	\N	\N	1
79	2	81	3	213.00	0	1854.94	395102.22	2026-04-26 18:28:15.63332	COMPLETADA	\N	PENDIENTE	\N	11	LIQUIDADO	AFILIADO	\N	\N	\N	1
82	2	48	3	122.00	0	1854.94	226302.68	2026-04-27 10:12:38.127618	COMPLETADA	\N	PENDIENTE	\N	11	LIQUIDADO	AFILIADO	\N	\N	\N	1
83	2	48	2	211.00	0	1854.94	391392.34	2026-04-27 10:12:38.190705	COMPLETADA	\N	PENDIENTE	\N	11	LIQUIDADO	AFILIADO	\N	\N	\N	1
32	24	19	3	123.00	0	1937.48	238310.04	2026-04-10 09:21:04.750046	COMPLETADA	\N	PENDIENTE	\N	6	LIQUIDADO	AFILIADO	\N	\N	\N	1
31	24	43	3	76.00	0	1937.48	147248.48	2026-04-10 09:21:04.631851	COMPLETADA	\N	PENDIENTE	\N	6	LIQUIDADO	AFILIADO	\N	\N	\N	1
34	24	18	3	321.00	0	1937.48	621931.08	2026-04-10 10:22:39.806665	COMPLETADA	\N	PENDIENTE	\N	6	LIQUIDADO	AFILIADO	\N	\N	\N	1
86	2	88	4	111.00	0	\N	\N	2026-04-27 15:48:31.510085	COMPLETADA	\N	PENDIENTE	\N	11	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
36	2	43	3	430.00	0	1714.20	737106.00	2026-04-10 16:46:29.447307	COMPLETADA	\N	PENDIENTE	\N	7	LIQUIDADO	AFILIADO	\N	\N	\N	1
38	2	19	3	230.00	0	1714.20	394266.00	2026-04-12 19:54:27.135644	COMPLETADA	\N	PENDIENTE	\N	7	LIQUIDADO	AFILIADO	\N	\N	\N	1
7	2	18	3	49.00	0	866.17	42442.33	2026-03-22 15:18:56.700754	COMPLETADA	\N	PENDIENTE	\N	1	LIQUIDADO	AFILIADO	\N	\N	\N	1
41	2	43	2	229.99	0	1365.60	314074.34	2026-04-17 14:51:32.187903	COMPLETADA	\N	PENDIENTE	\N	8	LIQUIDADO	AFILIADO	\N	\N	\N	1
43	2	46	2	199.98	0	1365.60	273092.69	2026-04-17 15:12:12.622397	COMPLETADA	\N	PENDIENTE	\N	8	LIQUIDADO	AFILIADO	\N	\N	\N	1
45	2	48	3	119.99	0	1365.60	163858.34	2026-04-17 15:13:22.885379	COMPLETADA	/uploads/comprobantes/comp_45_1776477093777.jpg	PAGADO	2026-04-17 20:51:33.786	8	PAGADO	AFILIADO	\N	\N	\N	1
40	2	19	3	230.00	0	1365.60	314088.00	2026-04-17 14:51:32.121471	COMPLETADA	/uploads/comprobantes/comp_40_1776477100475.jpg	PAGADO	2026-04-17 20:51:40.483	8	PAGADO	AFILIADO	\N	\N	\N	1
47	2	3	2	123.00	0	1677.25	206301.75	2026-04-22 20:42:43.704048	COMPLETADA	\N	PENDIENTE	\N	9	LIQUIDADO	AFILIADO	\N	\N	\N	1
2	2	3	2	10.50	5	426.22	4475.31	2026-03-19 01:10:02.158791	COMPLETADA	\N	PENDIENTE	\N	2	LIQUIDADO	AFILIADO	\N	\N	\N	1
11	2	18	3	120.00	0	426.22	51146.40	2026-03-22 15:48:26.716651	COMPLETADA	\N	PENDIENTE	\N	2	LIQUIDADO	AFILIADO	\N	\N	\N	1
12	2	18	3	99.00	0	426.22	42195.78	2026-03-22 16:08:06.290454	COMPLETADA	\N	PENDIENTE	\N	2	LIQUIDADO	AFILIADO	\N	\N	\N	1
9	2	29	3	50.00	0	866.17	43308.50	2026-03-22 15:19:58.53369	COMPLETADA	/uploads/comprobantes/comp_9_1774211684317.png	PAGADO	2026-03-22 15:34:44.338	1	PAGADO	AFILIADO	\N	\N	\N	1
8	2	19	3	89.00	0	866.17	77089.13	2026-03-22 15:19:25.256155	COMPLETADA	/uploads/comprobantes/comp_8_1774211709731.pdf	PAGADO	2026-03-22 15:35:09.738	1	PAGADO	AFILIADO	\N	\N	\N	1
6	24	19	3	20.00	0	426.22	8524.40	2026-03-20 15:56:52.286598	COMPLETADA	/uploads/comprobantes/comp_6_1774137380487.pdf	PAGADO	2026-03-21 18:56:20.5	2	PAGADO	AFILIADO	\N	\N	\N	1
13	2	19	3	140.00	0	426.22	59670.80	2026-03-22 16:08:44.223008	COMPLETADA	/uploads/comprobantes/comp_13_1774233431961.pdf	PAGADO	2026-03-22 21:37:11.983	2	PAGADO	AFILIADO	\N	\N	\N	1
10	2	29	3	89.00	0	426.22	37933.58	2026-03-22 15:47:58.639264	COMPLETADA	/uploads/comprobantes/comp_10_1774234522438.png	PAGADO	2026-03-22 21:55:22.453	2	PAGADO	AFILIADO	\N	\N	\N	1
5	24	29	2	54.00	0	426.22	23015.88	2026-03-20 09:42:47.804677	COMPLETADA	/uploads/comprobantes/comp_5_1774234530643.png	PAGADO	2026-03-22 21:55:30.658	2	PAGADO	AFILIADO	\N	\N	\N	1
4	24	29	4	21.00	0	426.22	8950.62	2026-03-19 07:26:02.35892	COMPLETADA	/uploads/comprobantes/comp_4_1774234548698.png	PAGADO	2026-03-22 21:55:48.719	2	PAGADO	AFILIADO	\N	\N	\N	1
49	2	29	3	455.99	0	1877.38	856066.51	2026-04-24 12:27:28.502275	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
51	2	49	2	233.99	0	1877.38	439288.15	2026-04-24 15:31:55.29645	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
53	2	60	3	250.00	0	1877.38	469345.00	2026-04-26 17:53:24.753941	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
55	2	58	2	351.00	0	1877.38	658960.38	2026-04-26 18:10:40.88166	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
58	2	61	3	126.00	0	1877.38	236549.88	2026-04-26 18:12:52.726518	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
60	2	65	3	214.00	0	1877.38	401759.32	2026-04-26 18:13:57.308437	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
62	2	67	3	134.00	0	1877.38	251568.92	2026-04-26 18:14:47.010829	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
64	2	69	3	125.00	0	1877.38	234672.50	2026-04-26 18:15:27.589898	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
66	2	71	2	154.00	0	1877.38	289116.52	2026-04-26 18:16:05.995042	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
68	2	73	3	102.00	0	1877.38	191492.76	2026-04-26 18:16:59.756466	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
70	2	75	2	125.00	0	1877.38	234672.50	2026-04-26 18:17:44.73727	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
72	2	77	3	102.00	0	1877.38	191492.76	2026-04-26 18:18:28.243856	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
74	2	79	3	122.00	0	1877.38	229040.36	2026-04-26 18:19:29.917876	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
76	2	81	3	136.00	0	1877.38	255323.68	2026-04-26 18:20:26.358979	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
78	2	83	3	25.00	0	1877.38	46934.50	2026-04-26 18:21:12.248412	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
3	24	29	3	34.00	0	426.22	14491.48	2026-03-19 07:26:02.289724	COMPLETADA	/uploads/comprobantes/comp_3_1774234558026.png	PAGADO	2026-03-22 21:55:58.036	2	PAGADO	AFILIADO	\N	\N	\N	1
188	2	168	3	12.00	0	\N	\N	2026-04-27 22:11:59.642734	COMPLETADA	\N	PENDIENTE	\N	14	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
29	2	19	2	345.00	0	1928.78	665429.10	2026-04-07 16:09:36.420283	COMPLETADA	\N	PENDIENTE	\N	5	LIQUIDADO	AFILIADO	\N	\N	\N	1
80	2	84	4	321.00	0	1854.94	595435.74	2026-04-26 18:29:30.915435	COMPLETADA	\N	PENDIENTE	\N	11	LIQUIDADO	AFILIADO	\N	\N	\N	1
15	4	29	3	514.00	0	1921.73	987769.22	2026-03-26 13:58:14.61953	COMPLETADA	/uploads/comprobantes/comp_15_1776477052618.jpg	PAGADO	2026-04-17 20:50:52.625	14	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
16	4	29	2	49.00	0	1447.50	70927.50	2026-03-26 13:58:14.688002	COMPLETADA	/uploads/comprobantes/comp_16_1776477058533.jpg	PAGADO	2026-04-17 20:50:58.539	14	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
35	24	18	3	321.00	0	1937.48	621931.08	2026-04-10 10:22:39.831894	COMPLETADA	/uploads/comprobantes/comp_35_1775855098952.jpg	PAGADO	2026-04-10 16:04:58.998	6	PAGADO	AFILIADO	\N	\N	\N	1
19	2	19	3	143.00	0	1334.32	190807.76	2026-03-26 19:36:57.617848	COMPLETADA	\N	PENDIENTE	\N	3	LIQUIDADO	AFILIADO	\N	\N	\N	1
20	2	19	2	200.00	0	1334.32	266864.00	2026-03-27 19:49:38.999811	COMPLETADA	\N	PENDIENTE	\N	3	LIQUIDADO	AFILIADO	\N	\N	\N	1
21	2	19	3	300.00	0	1334.32	400296.00	2026-03-27 19:49:39.04291	COMPLETADA	\N	PENDIENTE	\N	3	LIQUIDADO	AFILIADO	\N	\N	\N	1
39	2	18	3	540.00	0	1714.20	925668.00	2026-04-12 19:54:54.734527	COMPLETADA	/uploads/comprobantes/comp_39_1776285435910.jpg	PAGADO	2026-04-15 15:37:15.945	7	PAGADO	AFILIADO	\N	\N	\N	1
23	2	\N	4	23.00	0	2985.78	68672.94	2026-03-27 22:44:53.948221	COMPLETADA	\N	PENDIENTE	\N	4	LIQUIDADO	EXTERNO	Juan Camilo Meza	\N	\N	1
24	2	\N	3	23.00	0	2985.78	68672.94	2026-03-29 17:53:51.199656	COMPLETADA	\N	PENDIENTE	\N	4	LIQUIDADO	EXTERNO	Angelmiro Lugo ELizaldes	321453690	\N	1
25	2	18	3	45.00	0	2985.78	134360.10	2026-03-29 18:04:19.382174	COMPLETADA	\N	PENDIENTE	\N	4	LIQUIDADO	AFILIADO	\N	\N	\N	1
26	2	19	3	230.00	0	2985.78	686729.40	2026-03-29 18:14:43.376861	COMPLETADA	\N	PENDIENTE	\N	4	LIQUIDADO	AFILIADO	\N	\N	\N	1
27	2	3	3	600.00	0	2985.78	1791468.00	2026-03-29 18:18:57.424127	COMPLETADA	\N	PENDIENTE	\N	4	LIQUIDADO	AFILIADO	\N	\N	\N	1
42	2	45	4	200.00	0	1365.60	273120.00	2026-04-17 15:11:21.545109	COMPLETADA	\N	PENDIENTE	\N	8	LIQUIDADO	AFILIADO	\N	\N	\N	1
44	2	47	4	234.00	0	1365.60	319550.40	2026-04-17 15:12:50.028094	COMPLETADA	\N	PENDIENTE	\N	8	LIQUIDADO	AFILIADO	\N	\N	\N	1
37	2	29	3	654.00	0	1714.20	1121086.80	2026-04-12 19:53:50.143853	COMPLETADA	/uploads/comprobantes/comp_37_1776477025582.jpg	PAGADO	2026-04-17 20:50:25.593	7	PAGADO	AFILIADO	\N	\N	\N	1
14	2	29	3	176.00	0	1334.32	234840.32	2026-03-24 12:35:23.152777	COMPLETADA	/uploads/comprobantes/comp_14_1776477048712.jpg	PAGADO	2026-04-17 20:50:48.723	3	PAGADO	AFILIADO	\N	\N	\N	1
17	2	29	3	24.00	0	1334.32	32023.68	2026-03-26 17:28:13.125606	COMPLETADA	/uploads/comprobantes/comp_17_1776477067253.jpg	PAGADO	2026-04-17 20:51:07.26	3	PAGADO	AFILIADO	\N	\N	\N	1
18	2	18	3	129.00	0	1334.32	172127.28	2026-03-26 19:36:37.041044	COMPLETADA	/uploads/comprobantes/comp_18_1776477073737.jpg	PAGADO	2026-04-17 20:51:13.743	3	PAGADO	AFILIADO	\N	\N	\N	1
46	2	49	3	344.99	0	1365.60	471118.34	2026-04-17 15:14:13.839958	COMPLETADA	/uploads/comprobantes/comp_46_1776477089506.jpg	PAGADO	2026-04-17 20:51:29.511	8	PAGADO	AFILIADO	\N	\N	\N	1
22	2	29	4	23.00	0	2985.78	68672.94	2026-03-27 22:43:26.56449	COMPLETADA	/uploads/comprobantes/comp_22_1776478048626.jpg	PAGADO	2026-04-17 21:07:28.641	4	PAGADO	AFILIADO	\N	\N	\N	1
33	24	29	3	243.00	0	1937.48	470807.64	2026-04-10 10:19:18.247338	COMPLETADA	/uploads/comprobantes/comp_33_1776478066444.jpg	PAGADO	2026-04-17 21:07:46.451	6	PAGADO	AFILIADO	\N	\N	\N	1
48	2	18	3	200.00	0	1677.25	335450.00	2026-04-24 11:59:26.559191	COMPLETADA	\N	PENDIENTE	\N	9	LIQUIDADO	AFILIADO	\N	\N	\N	1
50	2	51	3	233.99	0	1877.38	439288.15	2026-04-24 15:24:14.547206	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
52	2	59	3	200.00	0	1877.38	375476.00	2026-04-26 17:52:55.866005	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
54	2	57	3	58.00	0	1877.38	108888.04	2026-04-26 18:10:19.194698	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
56	2	59	3	258.00	0	1877.38	484364.04	2026-04-26 18:11:18.543894	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
57	2	59	2	125.00	0	1877.38	234672.50	2026-04-26 18:11:19.032227	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
59	2	63	2	25.00	0	1877.38	46934.50	2026-04-26 18:13:16.275995	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
61	2	66	3	123.00	0	1877.38	230917.74	2026-04-26 18:14:23.410168	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
63	2	68	3	145.00	0	1877.38	272220.10	2026-04-26 18:15:10.408355	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
65	2	70	3	214.00	0	1877.38	401759.32	2026-04-26 18:15:46.135318	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
67	2	72	3	311.00	0	1877.38	583865.18	2026-04-26 18:16:35.245359	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
69	2	74	2	231.00	0	1877.38	433674.78	2026-04-26 18:17:21.65291	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
71	2	76	3	147.00	0	1877.38	275974.86	2026-04-26 18:18:08.361569	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
73	2	78	3	214.00	0	1877.38	401759.32	2026-04-26 18:19:08.444194	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
75	2	80	3	111.00	0	1877.38	208389.18	2026-04-26 18:20:07.750001	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
77	2	82	2	125.00	0	1877.38	234672.50	2026-04-26 18:20:45.510315	COMPLETADA	\N	PENDIENTE	\N	10	LIQUIDADO	AFILIADO	\N	\N	\N	1
189	2	119	3	112.00	0	\N	\N	2026-04-28 08:14:26.863665	COMPLETADA	\N	PENDIENTE	\N	14	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
81	2	85	3	258.00	0	1854.94	478574.52	2026-04-27 09:50:42.61221	COMPLETADA	\N	PENDIENTE	\N	11	LIQUIDADO	AFILIADO	\N	\N	\N	1
85	2	87	2	12.00	0	\N	\N	2026-04-27 15:48:00.514359	COMPLETADA	\N	PENDIENTE	\N	11	PENDIENTE_LIQUIDACION	AFILIADO	\N	\N	\N	1
89	2	91	3	10.00	0	1886.33	18863.30	2026-04-27 15:50:12.374338	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
92	2	94	3	13.00	0	1886.33	24522.29	2026-04-27 15:51:13.381415	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
95	2	97	2	16.00	0	1886.33	30181.28	2026-04-27 15:53:46.392926	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
98	2	100	3	70.00	0	1886.33	132043.10	2026-04-27 15:55:00.19762	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
101	2	103	2	12.00	0	1886.33	22635.96	2026-04-27 16:20:09.790183	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
104	2	106	2	47.00	0	1886.33	88657.51	2026-04-27 16:20:59.019485	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
107	2	109	2	73.00	0	1886.33	137702.09	2026-04-27 16:22:30.21502	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
110	2	112	2	59.00	0	1886.33	111293.47	2026-04-27 16:23:31.993672	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
113	2	115	3	231.00	0	1886.33	435742.23	2026-04-27 16:24:55.184284	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
116	2	118	2	19.00	0	1886.33	35840.27	2026-04-27 16:26:10.987528	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
119	2	121	3	156.00	0	1886.33	294267.48	2026-04-27 16:27:17.460006	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
84	2	51	4	22.99	0	1886.33	43366.73	2026-04-27 15:31:30.207842	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
87	2	89	3	123.00	0	1886.33	232018.59	2026-04-27 15:49:01.277019	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
90	2	92	4	12.00	0	1886.33	22635.96	2026-04-27 15:50:31.800767	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
93	2	95	3	15.00	0	1886.33	28294.95	2026-04-27 15:52:35.054313	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
96	2	98	2	90.00	0	1886.33	169769.70	2026-04-27 15:54:06.316528	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
99	2	101	2	13.00	0	1886.33	24522.29	2026-04-27 15:55:20.862688	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
102	2	104	3	12.00	0	1886.33	22635.96	2026-04-27 16:20:27.667474	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
88	2	90	2	50.00	0	1886.33	94316.50	2026-04-27 15:49:37.686787	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
105	2	107	3	79.00	0	1886.33	149020.07	2026-04-27 16:21:23.528102	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
108	2	110	3	46.00	0	1886.33	86771.18	2026-04-27 16:22:47.583857	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
111	2	113	3	92.00	0	1886.33	173542.36	2026-04-27 16:23:55.756446	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
114	2	116	3	135.00	0	1886.33	254654.55	2026-04-27 16:25:27.826703	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
117	2	119	2	156.00	0	1886.33	294267.48	2026-04-27 16:26:35.85267	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
120	2	122	3	135.00	0	1886.33	254654.55	2026-04-27 16:28:34.552118	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
122	2	124	2	123.00	0	1886.33	232018.59	2026-04-27 16:29:10.157308	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
91	2	93	2	12.00	0	1886.33	22635.96	2026-04-27 15:50:53.698316	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
94	2	96	3	80.00	0	1886.33	150906.40	2026-04-27 15:53:12.047206	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
97	2	99	2	15.00	0	1886.33	28294.95	2026-04-27 15:54:31.910042	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
100	2	102	2	15.00	0	1886.33	28294.95	2026-04-27 15:55:43.002315	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
103	2	105	2	16.00	0	1886.33	30181.28	2026-04-27 16:20:43.334281	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
106	2	108	3	96.00	0	1886.33	181087.68	2026-04-27 16:22:07.574858	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
109	2	111	3	161.00	0	1886.33	303699.13	2026-04-27 16:23:07.475715	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
112	2	114	2	85.00	0	1886.33	160338.05	2026-04-27 16:24:33.90752	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
115	2	117	2	57.00	0	1886.33	107520.81	2026-04-27 16:25:51.09632	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
118	2	120	2	111.00	0	1886.33	209382.63	2026-04-27 16:26:55.044402	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
121	2	123	3	145.00	0	1886.33	273517.85	2026-04-27 16:28:51.754143	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
123	2	125	3	143.00	0	1886.33	269745.19	2026-04-27 16:29:30.879033	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
124	2	127	3	156.00	0	1886.33	294267.48	2026-04-27 16:30:07.927132	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
125	2	128	2	159.00	0	1886.33	299926.47	2026-04-27 16:30:33.035634	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
126	2	129	2	251.00	0	1886.33	473468.83	2026-04-27 16:30:54.229548	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
127	2	130	3	129.00	0	1886.33	243336.57	2026-04-27 16:31:29.333782	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
128	2	131	3	25.00	0	1886.33	47158.25	2026-04-27 16:32:00.153111	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
129	2	132	2	154.00	0	1886.33	290494.82	2026-04-27 16:32:18.273111	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
130	2	133	3	156.00	0	1886.33	294267.48	2026-04-27 16:35:02.18314	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
131	2	134	2	198.00	0	1886.33	373493.34	2026-04-27 16:35:27.536019	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
132	2	135	2	145.00	0	1886.33	273517.85	2026-04-27 16:36:04.007402	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
133	2	136	3	156.00	0	1886.33	294267.48	2026-04-27 16:36:29.196305	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
134	2	137	3	184.00	0	1886.33	347084.72	2026-04-27 16:36:47.178811	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
135	2	138	2	174.00	0	1886.33	328221.42	2026-04-27 16:37:11.730655	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
136	2	139	3	321.00	0	1886.33	605511.93	2026-04-27 16:37:29.419626	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
137	2	140	3	165.00	0	1886.33	311244.45	2026-04-27 16:37:55.715946	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
138	2	141	3	259.00	0	1886.33	488559.47	2026-04-27 16:38:16.608338	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
139	2	142	3	199.00	0	1886.33	375379.67	2026-04-27 16:39:01.513742	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
140	2	143	3	214.00	0	1886.33	403674.62	2026-04-27 16:39:28.903935	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
141	2	144	3	124.00	0	1886.33	233904.92	2026-04-27 16:40:20.408746	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
142	2	145	3	158.00	0	1886.33	298040.14	2026-04-27 16:41:47.826232	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
143	2	146	3	123.00	0	1886.33	232018.59	2026-04-27 16:48:59.096712	COMPLETADA	\N	PENDIENTE	\N	12	LIQUIDADO	AFILIADO	\N	\N	\N	1
144	2	72	3	200.00	0	1915.28	383056.00	2026-04-27 19:04:11.712446	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
145	2	72	2	123.00	0	1915.28	235579.44	2026-04-27 19:04:12.154385	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
146	2	81	3	214.00	0	1915.28	409869.92	2026-04-27 19:56:52.798345	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
147	2	89	3	165.00	0	1915.28	316021.20	2026-04-27 19:56:55.256334	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
148	2	85	2	12.00	0	1915.28	22983.36	2026-04-27 19:57:55.798019	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
149	2	91	3	213.00	0	1915.28	407954.64	2026-04-27 19:57:56.757578	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
150	2	94	3	253.00	0	1915.28	484565.84	2026-04-27 19:57:57.401427	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
151	2	96	3	231.00	0	1915.28	442429.68	2026-04-27 19:57:58.187484	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
152	2	98	3	235.00	0	1915.28	450090.80	2026-04-27 19:57:58.768635	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
153	2	100	3	200.00	0	1915.28	383056.00	2026-04-27 19:57:59.247373	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
154	2	102	3	256.00	0	1915.28	490311.68	2026-04-27 19:57:59.770051	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
155	2	104	3	247.00	0	1915.28	473074.16	2026-04-27 19:58:00.343572	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
156	2	106	3	210.00	0	1915.28	402208.80	2026-04-27 19:58:01.567649	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
157	2	106	3	210.00	0	1915.28	402208.80	2026-04-27 19:58:33.061117	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
158	2	108	3	289.00	0	1915.28	553515.92	2026-04-27 19:58:33.525841	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
159	2	110	3	256.00	0	1915.28	490311.68	2026-04-27 19:58:34.289546	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
160	2	112	3	126.00	0	1915.28	241325.28	2026-04-27 19:58:35.090683	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
161	2	114	2	243.00	0	1915.28	465413.04	2026-04-27 19:58:35.589907	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
162	2	67	3	254.00	0	1915.28	486481.12	2026-04-27 19:58:36.263832	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
163	2	67	3	254.00	0	1915.28	486481.12	2026-04-27 19:58:44.603133	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
164	2	74	3	215.00	0	1915.28	411785.20	2026-04-27 19:58:44.975471	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
165	2	77	3	289.00	0	1915.28	553515.92	2026-04-27 19:58:45.619802	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
166	2	80	2	125.00	0	1915.28	239410.00	2026-04-27 19:58:46.148638	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
167	2	82	3	216.00	0	1915.28	413700.48	2026-04-27 19:58:46.753939	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
168	2	127	3	32.00	0	1915.28	61288.96	2026-04-27 20:16:08.02864	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
169	2	128	3	29.00	0	1915.28	55543.12	2026-04-27 20:16:08.580176	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
170	2	129	3	54.00	0	1915.28	103425.12	2026-04-27 20:16:09.103837	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
171	2	130	3	89.00	0	1915.28	170459.92	2026-04-27 20:16:09.593688	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
172	2	131	3	99.00	0	1915.28	189612.72	2026-04-27 20:16:10.107094	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
173	2	132	3	56.00	0	1915.28	107255.68	2026-04-27 20:16:10.656107	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
174	2	134	2	89.00	0	1915.28	170459.92	2026-04-27 20:16:11.434879	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
175	2	135	3	100.00	0	1915.28	191528.00	2026-04-27 20:16:12.117854	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
176	2	136	2	79.00	0	1915.28	151307.12	2026-04-27 20:16:12.615566	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
177	2	137	3	56.00	0	1915.28	107255.68	2026-04-27 20:16:13.173882	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
178	2	138	3	147.00	0	1915.28	281546.16	2026-04-27 20:16:14.368794	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
179	2	139	2	123.00	0	1915.28	235579.44	2026-04-27 20:16:15.095535	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
180	2	140	3	145.00	0	1915.28	277715.60	2026-04-27 20:16:15.525442	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
181	2	141	3	125.00	0	1915.28	239410.00	2026-04-27 20:16:15.955418	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
182	2	142	3	213.00	0	1915.28	407954.64	2026-04-27 20:16:16.60205	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
183	2	143	2	159.00	0	1915.28	304529.52	2026-04-27 20:16:17.046598	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
184	2	144	3	145.00	0	1915.28	277715.60	2026-04-27 20:16:17.684116	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
185	2	145	2	58.00	0	1915.28	111086.24	2026-04-27 20:16:18.398831	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
186	2	146	2	107.00	0	1915.28	204934.96	2026-04-27 20:16:18.869941	COMPLETADA	\N	PENDIENTE	\N	13	LIQUIDADO	AFILIADO	\N	\N	\N	1
\.


--
-- TOC entry 5271 (class 0 OID 24834)
-- Dependencies: 230
-- Data for Name: historial_precio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_precio (id_historial_precio, id_producto, precio, fecha_cambio, motivo) FROM stdin;
\.


--
-- TOC entry 5287 (class 0 OID 24959)
-- Dependencies: 246
-- Data for Name: historial_transaccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_transaccion (id_historial, id_compra, id_venta, tipo_transaccion, fecha_transaccion, monto, estado) FROM stdin;
1	3	\N	compra	2026-03-11 15:02:51.313717	150000.00	completada
2	\N	2	venta	2026-03-11 15:06:32.51972	100000.00	completada
\.


--
-- TOC entry 5299 (class 0 OID 25056)
-- Dependencies: 258
-- Data for Name: modo_offline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modo_offline (id_offline, id_operario, datos_cache, fecha_sincronizacion, sincronizado) FROM stdin;
\.


--
-- TOC entry 5263 (class 0 OID 24769)
-- Dependencies: 222
-- Data for Name: operario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operario (id_operario, id_usuario, area_trabajo) FROM stdin;
1	3	Ventas
2	24	Recoleccion
\.


--
-- TOC entry 5267 (class 0 OID 24801)
-- Dependencies: 226
-- Data for Name: perfil_productor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.perfil_productor (id_perfil, id_productor, biografia, foto_url, certificaciones, premios, ultima_actualizacion) FROM stdin;
\.


--
-- TOC entry 5305 (class 0 OID 33269)
-- Dependencies: 264
-- Data for Name: precios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.precios (id_precio, id_producto, precio_base_kg, precio_transporte, total_kilos, costo_transporte_kg, precio_final_kg, margen_asociacion, fecha, activo, asociacion_id) FROM stdin;
1	3	2000.00	60000.00	7000.00	8.5714	1921.73	0.0350	2026-03-21 14:42:40.393677	f	1
5	3	2100.00	0.00	1.00	0.0000	2026.50	0.0350	2026-04-09 09:48:59.790398	t	1
3	4	3200.00	0.00	1.00	0.0000	3088.00	0.0350	2026-03-22 21:13:11.179001	f	1
6	4	3100.00	0.00	1.00	0.0000	2991.50	0.0350	2026-04-09 09:49:11.119633	t	1
2	2	1500.00	0.00	1.00	0.0000	1447.50	0.0350	2026-03-22 21:12:53.620898	f	1
7	2	1800.00	0.00	1.00	0.0000	1737.00	0.0350	2026-04-09 09:49:22.507396	t	1
4	5	1200.00	0.00	1.00	0.0000	1158.00	0.0350	2026-03-22 21:13:18.297116	f	1
8	5	1500.00	0.00	1.00	0.0000	1447.50	0.0350	2026-04-09 09:49:30.304465	t	1
\.


--
-- TOC entry 5273 (class 0 OID 24847)
-- Dependencies: 232
-- Data for Name: produccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produccion (id_produccion, id_productor, id_producto, cantidad, unidad, fecha_produccion, fecha_cosecha, lote, estado) FROM stdin;
5	2	2	150.00	kg	2026-02-24	2024-03-15	LOTE-001	disponible
6	2	2	200.00	kg	2026-02-24	2024-03-20	LOTE-002	disponible
7	3	2	250.00	kg	2026-02-25	2026-02-18	LOTE-003	disponible
8	2	2	12000.00	kg	2026-03-09	2026-03-05	LOTE-002	disponible
9	2	2	100.00	kg	2026-03-09	2026-02-05	LOTE-002	disponible
10	2	2	50.00	kg	2026-03-09	2025-12-05	LOTE-002	disponible
\.


--
-- TOC entry 5269 (class 0 OID 24818)
-- Dependencies: 228
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto (id_producto, nombre, descripcion, unidad_medida, precio_base, disponible, asociacion_id) FROM stdin;
3	Platano	Platano pequeño	kg	2000.00	t	1
4	Manzanas	Manzanas rojas frescas	kg	2.50	t	1
5	Leche	Leche pasteurizada	litro	1.20	t	1
6	Huevos	Huevos de granja	docena	3.00	f	1
2	Yuca	Yuca fresca	kg	2000.00	t	1
\.


--
-- TOC entry 5265 (class 0 OID 24783)
-- Dependencies: 224
-- Data for Name: productor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productor (id_productor, id_usuario, finca, ubicacion, tipo_certificacion, codigo_qr, cedula, telefono, estado, asociacion_id) FROM stdin;
57	61	Finca La Vega	EL PORVENIR	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
58	62	Finca El Yarí	EL PRADO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
59	63	Finca San Pablo	LA CABAÑA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
60	64	Finca La Arboleda	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
18	20	Cristalina	La ceiba	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXQSURBVO3BMa4cWA4EsJLw739lrZMNJ3gDN6bLJjn3SwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/OTDZib8PneXFzOTF3eXFzOTF3eXbzIz4fe5u3zSBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET77M3eVvMjP5pLtLs5nJi7vLJ91d/iYzk2+yASixASixASixASixASixASixASixASixASixASixASjxk3Izk29yd/mb3F34ZzOTb3J3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPET/mgzkxd3l0+amcC/tQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8RP+aHeXFzOTT7q7vJiZwP9tAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr8pNzdhd/n7vJiZvJiZvI3ubvw+2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvzky8xM+H1mJi/uLp90d3kxM/kmMxP+OxuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEnO/BP6lmcmLuwv8WxuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj8pNzN5cXd5MTP5JneXFzOTF3eXF3eXFzOTF3eXFzOTF3eXbzIzeXF3+aSZyYu7yydtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr85C8zM3lxd3kxM3lxd3kxM/mkmck3mZnw+8xMXtxdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcL/mgmcmLu8s3mZl8k7vLi5nJN7m7fNLM5MXd5ZNmJi/uLi9mJt/k7vJJG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASPyk3M/mku8uLmcmLu8sn3V1ezEw+aWbySXeXFzOTF3eXF3eXFzOTF3eXFzOTZhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/ht7q7vJiZfNLdhf/OzOTF3eXFzORvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdL+GPNTPjv3F1ezExe3F1ezExe3F2+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxE8+bGbC73N3eXF3eTEzeXF3eTEzeXF3eTEzeXF3eTEz+aS7y4uZyYu7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImffJm7y99kZvJJM5O/yd3lm8xMPunu8mJm8kl3l0/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4SbmZyTe5u/xNZibfZGbyTe4unzQzeXF3eTEz+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBI/4Y92d3kxM3lxd3kxM/kmd5cXM5NmM5MXd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8RP+aDOTF3eXFzOTF3eXFzOTb3J3eTEzeXF3+aS7y4uZyYu7yydtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr8pNzdhX92d3kxM3lxd3kxM/mku8uLmckn3V1ezExe3F0+6e7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX7yZWYm9JiZvLi7NLu7vJiZvLi7fJOZyYu7yydtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/RKAAhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEv8DEm0VcKXnvuAAAAAASUVORK5CYII=	1000000122	3201234567	ACTIVO	1
29	23	Mono	Belen	\N	data:image/png;base64,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	1115722345	3214166044	ACTIVO	1
2	2	Finca La Esperanza	Florencia - Caquetá	Orgánica	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAW+SURBVO3BMa4c2o4EsJJw979ljYOfOjgDN16XTXLulwAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+MmHzUz4c+4uL2Ymze4unzQz4c+5u3zSBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET77M3eVfMjP5pLvLJ81MXtxdmt1d/iUzk2+yASixASixASixASixASixASixASixASixASixASixASjxk3Izk29yd+H3ZiYv7i7NZibf5O7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4if81WYmL+4uL+4uL2Ym8P+1ASixASixASixASixASixASixASixASixASixASixASjxE/5qd5cXM5NvMjN5cXfh77UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTcncX/py7yzeZmTS7u/DnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/OTLzEz4c2YmL+4uL2YmL+4uzWYm/Hc2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXmfgn8z8zkxd3lxczkk+4u/L02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACV+Um5m8uLu8mJm8k3uLi9mJi/uLi9mJi/uLi9mJi9mJi/uLt9kZvLi7vJJM5MXd5dP2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPslX2Rm8uLu8mJm8kl3F/47M5NPurv8S2YmL+4un7QBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTD5uZvLi7/EtmJp90d/mX3F1ezEw+aWby4u7yYmbySXeXb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3S4rNTF7cXV7MTF7cXb7JzKTZ3eXFzOTF3eVfMjP5pLvLJ20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvzky8xMvsnd5ZNmJp90d/kmM5NvMjN5cXd5MTPhz9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7Jfy1ZiYv7i4vZib83t3lxczkxd3lxczkxd3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvzkw2Ym/Dl3lxd3lxczkxd3l28yM3lxd3kxM/kmM5MXd5dmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASP/kyd5d/yczkk2YmzWYmL+4u32Rm8uLu8mJm8mJm8kl3l0/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4SbmZyTe5u/xLZib83t3lxczkk+4uL2Ym32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIn/NXuLvS4u3zSzOTF3eWbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/IS/2szkxd3lxczkm9xdXsxMXtxdXsxMXtxdXsxMXtxdXsxMXtxdPmkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIn5e4u/N7d5ZPuLt9kZvLi7vJiZvLi7vJiZvLi7vJJd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ZMvMzPhvzMzeXF3+ZfcXV7MTF7cXV7MTF7cXV7MTF7cXT5pA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Bi7pcAFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPg/bPUQaZpfZ/wAAAAASUVORK5CYII=	1112764680	30022456789	INACTIVO	1
61	65	Finca Los Almendros	EL DIAMANTE	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
62	66	Finca El Tambo	SAN LUIS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
63	67	Finca La Abundancia	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
64	68	Finca La Fortuna	LOS ALETONES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAW8SURBVO3BMZIgCQ0EwJJi/v9lsQ4ROGc0XHNdu5k590sACmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvzkZTMT/j53lydmJk/cXZ6YmTxxd3liZvLE3eWJmQl/n7vLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX7yMXeXP8nM5EtmJm+amTxxd/mSu8ufZGbyJRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj8pNzP5krvLn+Tu8qaZyRN3ly+ZmXzJ3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET/it3V2emJk8MTN5090F/m0DUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIn8B/uLk/MTN40M3ni7sLvawNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4ifl7i78tZnJE3eXJ+4uT8xMnri7NLu78PfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4ycfMTOgxM3ni7vLEzOSJu8ubZib8czYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeZ+Cb+tmcmX3F3gv7UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTcjOTL7m7PDEzeeLu8iV3ly+ZmXzJ3eVNM5Mvubu8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4icvm5k8cXd5093lTTOTJ+4uT8xM/iQzkyfuLm+ambxpZvLE3eVPsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ZOX3V2azUyeuLs8MTN5093liZnJm2YmT9xdvuTu8sTM5E0zkyfuLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXmfsmLZiZP3F3eNDN54u7yxMzkibvLEzOTP8nd5UtmJm+6uzwxM/mSu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlflJuZvLE3eWJmcmbZiZP3F2emJl8yd3liZnJl9xdnpiZPDEzeeLu8qaZyZdsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/RJ+WzOTL7m7fMnM5Im7C/+cDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJuV/yopkJf5+7y5tmJk/cXb5kZvIld5cnZiZP3F3+JBuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/5mLvLn2Rm8iV3l2Z3l2Z3lydmJk/cXZ6YmTxxd3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET8rNTL7k7vIlM5Mvubu8aWbyJXeXJ2YmX3J3+ZINQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImfwP/RzORNd5c3zUzedHfhr20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvwE/gd3lzfNTN40M3ni7vLEzOSJu8sTM5Mn7i7NNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlflLu7sJfu7s8MTN508zkS+4uT8xMms1Mnri7fMkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMRPPmZmwj/n7vLEzORNd5cnZiZvurs8MTP5krtLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiblfAlBgA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiX47+DWlFR3wlAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
65	69	Finca La Siembra	EL PORVENIR	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
66	70	Finca El Quindío	LOS ANGELES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWOSURBVO3BQY4kiQ0EsJBQ//+yPBcDvuwhjU5sxTTJuT8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTl81M+Dl3lydmJm+6uzwxM3nT3eWJmQk/5+7ypg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++zN3lN5mZ0OPu8pvMTL7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+VmJt/k7vJN7i5vmpm86e7SbGbyTe4uzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT7hrzYzeeLu8sTd5U0zkyfuLvy9NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPoH/MTOBb7UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJubsLf6+7S7O7Cz9nA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky8zM+Hfc3d5YmbyxN3liZnJE3eXN81M+PdsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/RH4P81M3nR3gf/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45JeZmTxxd3nTzOSJu8ubZiZvurs8MTN54u7yppnJN7m7PDEzedPd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxm8sTd5YmZyZtmJm+6u7xpZtLs7vKmmcmb7i5vmpm86e7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeb+yBeZmTxxd3liZvLE3eWJmcmb7i7fZGbyxN3liZnJE3eXJ2Ym/Jy7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXm/sgvMjN5093lm8xMnri7PDEz4efcXfhnG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5SbmTxxd3liZvKmmckTd5cn7i7f5O7yppnJN7m7PDEzeeLu8ptsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/RH+WjOTJ+4u/JyZyRN3F/7ZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmfBz7i5P3F2emJl8k7vLEzOTN91d3jQzedPdpdkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX+bu8pvMTH6Tu8sTM5Mn7i7f5O7yppnJEzOTN91d3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJuZnJN7m7NLu7PDEz+SYzkyfuLvTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4hL/azOSJu8ubZiZvuru8aWbyxN3lTXeXJ2YmzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT7hr3Z3eWJm8qa7yzeZmTSbmTxxd3liZvJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPil3d+Hn3F2azUyeuLs8MTN508zkibvLEzOTJ+4u32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTLzMzocfM5E13lzfNTJrNTJ64uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+yMABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJf4DiyP7VJIyJ8oAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
3	3	Las delicias	Belen de los andaquies	Orgánica	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXBSURBVO3BMQ4kiQ0EsJIw//+yfIlDBw1sw117JOf+EYACG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASv7xsZsKfc3d5YmbyxN3liZnJE3eXL5mZ8OfcXd60ASixASixASixASixASixASixASixASixASixASixASjxy8fcXf5NZiZvurs8MTP5kpnJE3eXN91d/k1mJl+yASixASixASixASixASixASixASixASixASixASixASjxS7mZyZfcXZrdXZ6YmfC/zUy+5O7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4hf+ajOTJ+4u8FUbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBK/8Fe7uzS7u8B/bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/FLu7sKfMzP5kpnJE3eXL7m78OdsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr88jEzE/6cmckTd5cnZib/JjMT/n82ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXm/hH4qJnJE3cX/l4bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBK/lJuZPHF3eWJm8iV3lydmJk/cXZrNTJ64u3zJzOSJu8ubZiZP3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cvLZiZvuru86e7yxMzkibvLEzOTJ+4uXzIzeeLu8sTM5ImZyRN3ly+ZmTxxd2m2ASixASixASixASixASixASixASixASixASixASixASjxy8fcXZrdXZ6YmTxxd3nTzORLZiZP3F2+ZGbyprvLEzOTJ+4uX7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3j7xoZvKmu8sTM5M33V2azUyeuLs8MTN54u7yppnJE3eXN81Mmt1d3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHLx9xdvuTu8qaZyZfcXd50d3liZvLE3eVLZiZvurs8MTNptgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfeP8NeamTS7u3zJzOSJu8ubZiZvurt8yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxC8vm5nw59xdnri7vGlm8qaZCX/O3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDELx9zd/k3mZm8aWbyxN3libvLm2YmT9xd3jQzeWJm8sTd5U0zkzfdXd60ASixASixASixASixASixASixASixASixASixASixASjxS7mZyZfcXZrNTN50d3nTzORL7i5vuru8aWbyJRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEr/wV7u7PDEz+Te5uzwxM3nTzORL7i5fsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Qt/tZlJs7vLl9xdnpiZPHF3eWJm8sTd5YmZyRN3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr8Uu7uwv92d3liZvLE3eWJmckTd5cnZiZP3F2emJk8cXd5YmbyJXeXL9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjlY2Ym9JiZNJuZPHF3eWJm8sTd5YmZyZtmJk/cXd60ASixASixASixASixASixASixASixASixASixASixASgx948AFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPgPNVYSarDn2EMAAAAASUVORK5CYII=	1117512328	32196789253	ACTIVO	1
67	71	Finca El Gavilán	LOS ALETONES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAV8SURBVO3BQY4kBw4EsJBQ//+ydo6++JBA57pimuTcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZib8nLvLm2YmT9xdnpiZPHF3edPMhJ9zd3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ1/m7vKbzEx+k7tLs7vLbzIz+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflJuZfJO7yzeZmbxpZvLE3eWJmckTd5dvMjP5JneXZhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/AP9xd4FttAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8wl/t7vKmmQn8v2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u4C3+ruws/ZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvMTPg5M5Mn7i5vurs8MTP5JjMT/jsbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzfwSgwAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCe/zMzkTXeXJ2Ymb7q7PDEzeeLu8sTM5E13l2YzkzfdXZptAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88svcXd40M3ni7vLEzOQ3ubs0m5m86e7yxMzkibvLN9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7I8VmJvS4u7xpZvKmu8sTM5Pf5O7ypg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU9eNjN5093lTTOTJ+4uv8nM5ImZyZvuLk/MTN50d3liZvJN7i7fZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pMvc3d5YmbyprvLEzOTN91d3jQzedPdhX93d3nTzKTZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDE3B/hrzUzedPd5U0zkyfuLm+amTxxd2k2M3ni7vKmDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT142M+Hn3F3edHdpNjP5JjOTN91dnpiZPHF3+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffJm7y28yM3nT3eU3ubu8aWbyprvLEzOTJ+4uzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzP5JneXbzIzedPd5YmZyRN3l2Z3lydmJt9kZvLE3eVNG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn8A/3F2+yczkTXeXJ+4uT8xM3nR3edPd5ZtsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8wl/t7vLEzKTZ3eWb3F2emJk8MTP5JneXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u5Cj7vLm2Ymb7q7PDEzeeLu8sTM5Im7yxMzk2+yASixASixASixASixASixASixASixASixASixASixASjxyZeZmfDfubu8aWbyTe4ub7q7fJOZyRN3l2+yASixASixASixASixASixASixASixASixASixASixASgx90cACmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvwPAcX6Rg8bXscAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
43	38	Finca La Ventura	LA CABAÑA	\N	data:image/png;base64,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	1117486526	3214567843	ACTIVO	1
19	21	florinda	la cristalina	\N	data:image/png;base64,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	1234567890	3209243228	ACTIVO	1
20	22	ddd	ff	\N	data:image/png;base64,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	0987654321	3214567843	INACTIVO	1
44	48	Finca El Nogal	Vereda La Esperanza - Salento	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAVwSURBVO3BwY0cgQ0EwCax+adM62EHMMCNta2rqrk/AlBgA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fNTPg5d5ffZGbyxN3liZkJP+fu8qYNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPvszd5TeZmfwmM5Nmd5ffZGbyTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzP5JneXbzIzaXZ3aTYz+SZ3l2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfwBebmTxxd+HftQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Qn/tLvLm2Ymb7q7wP9sAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Uu7uwt9zd3nTzOSJu8s3ubvwczYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MjMTfs7M5Im7yxMzkyfuLs1mJvw9G4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASc38E/mtm8k3uLvA/G4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn/wyM5M33V2emJm86e7yprvLm2YmT9xdms1M3nR3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJy2Ymze4uT8xMnri7PDEzaTYzeeLu8sTMpNnd5YmZyRMzkzfdXd60ASixASixASixASixASixASixASixASixASixASixASjxycvuLk/MTN50d3nT3eWJmcmbZia/yd3lTTOTJ+4uT8xM3nR3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJLzMz+SZ3l2YzkyfuLk/MTJ64u3yTmcmb7i6/yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5l8k7vLN5mZNLu7PDEz+SYzk2YzkyfuLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXm/gj/rJlJs7sLP2dm8qa7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhJ9zd3nT3aXZzOSJuws9NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPvkyd5ffZGbyprvLEzOTJ+4uzWYmT9xdvsnM5Im7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPys1Mvsnd5ZvMTJrNTJrNTJ64uzxxd3nTzOSJu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPoH/o5nJE3eXJ2YmT9xdms1Mnri7PHF3+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKf8E+7u7xpZvLE3eWJmckTd5c3zUy+yd3liZnJm+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3N2Fv+fu8sTMpNndpdnd5YmZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvMTPh7ZiZvurs8MTP5JjOTN91dnpiZvOnu8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXm/ghAgQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aif8AM4LnZTJtDjEAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
45	49	Hacienda Los Cedros	Corregimiento San Pedro - Manizales	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWuSURBVO3BQY7giA0EsJLQ//+yMpcAueRgZIy4tknO/RGAAhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj952cyEv+fu8iUzkyfuLk/MTJ64uzwxM+Hvubu8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4icfc3f5TWYmv8nMpNnd5TeZmXzJBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET8rNTL7k7vIlM5Mvubv8JjOTL7m7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPgJ/A/uLm+amTxxd+GfawNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4if8o91dnpiZvGlm8sTdBf5tA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJ+XuLvS4uzwxM3ni7vIldxf+ng1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ98zMyEv2dm8sTd5YmZyRN3l2YzE/5/NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v4IQIENQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImf/DIzkzfdXZ6Ymbzp7vKmmcmX3F2azUzedHdptgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ZOXzUyeuLs8MTN5093lTXeXZneXN81MvmRm8iV3lydmJm+6u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJx8zM3ni7vIlM5Mvubs8MTN54u7yxMzkS2Ymb7q7fMndpdkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcH3nRzORNd5cnZiZP3F2azUyeuLt8yczkTXeXJ2Ymb7q7PDEzeeLu0mwDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLuj3zIzKTZ3eWJmcmX3F2emJk8cXf5kplJs7vLb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTj7m7/CZ3lzfNTJ6YmTxxd3liZvLE3eVL7i5vmpm8aWbyprvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX7yspkJf8/d5UtmJm+amTxxd3ni7vIldxf+uw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ98zN3lN5mZvOnu8sTM5Im7y5fMTJ64u/wmd5dmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASPyk3M/mSu8uXzEyeuLs8MTN54u7yxMzkibvLEzOTJ+4uT8xMvuTu8sTM5Im7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACV+Av9hZvLE3eVLZibN7i5fcnf5kg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ/wj3Z3eWJm8sTM5Im7y5vuLk/MTJ6YmbxpZvLE3eWJmcmb7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+Em5uws9ZiZP3F2+5O7yJTOTJ+4uT8xMvmQDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOInHzMz4f/n7vIlM5Mn7i5P3F2emJl8yd3liZnJE3eXL9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7IwAFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl/gUxZQ9b/bWEHgAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
46	50	Finca Las Palmas	Vereda El Recuerdo - Armenia	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAYGSURBVO3BQa4c1g0EwCbx73/ljhbJ0gGeoYGHVlVNfwnAARuAIzYAR2wAjtgAHLEBOGIDcMQG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxAbgiJ982MyE36dtXsxMXrTNi5nJi7Z5MTN50TYvZib8Pm3zSRuAIzYAR2wAjtgAHLEBOGIDcMQG4IgNwBEbgCM2AEdsAI74yZdpmz/JzOST2uaT2uaT2uabtM2fZGbyTTYAR2wAjtgAHLEBOGIDcMQG4IgNwBEbgCM2AEdsAI7YABzxk+NmJt+kbf4kM5NPapvLZibfpG0u2wAcsQE4YgNwxAbgiA3AERuAIzYAR2wAjtgAHLEBOGIDcMRP+Febmbxomxdt82JmAn/XBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxAbgiA3AERuAI37Cv1rbfNLM5EXbwN+1AThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxAbgiJ8c1zb8PjOTF23zSTOTF23zTdqG32cDcMQG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIDcARP/kyMxN+n5nJi7Z5MTN50TaXzUz452wAjtgAHLEBOGIDcMQG4IgNwBEbgCM2AEdsAI7YAByxAThi+kvgv2YmL9rmxczkRdvA/2wAjtgAHLEBOGIDcMQG4IgNwBEbgCM2AEdsAI7YAByxATjiJ8fNTF60zYuZyTdpmxczkxdt82Jm8kkzk09qm28yM3nRNp80M3nRNp+0AThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxAbgiJ/wf7XNi5nJi7Z5MTN50TaXtc2LmcmLmcmLtvmktnkxM3nRNi/a5ptsAI7YAByxAThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE44idfZmbySTOTF23zom1ezExetM2Lmck3aZsXM5MXbfNiZvJJM5PLZiYv2uaTNgBHbACO2AAcsQE4YgNwxAbgiA3AERuAIzYAR2wAjtgAHDH9JYfNTF60zYuZyYu2+aSZyYu2+aSZySe1zYuZySe1zSfNTD6pbS7bAByxAThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxE++zMzkRdu8mJm8aJsXM5NPapsXM5NPapsXM5MXM5PLZiaf1DYvZiYv2uabbACO2AAcsQE4YgNwxAbgiA3AERuAIzYAR2wAjtgAHLEBOOInX6ZtPqltPqltLmubFzOTT2qbT5qZvJiZvGibFzMT/toG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIDcARG4Ajpr/kg2Ym/D5t80kzkxdt801mJi/a5sXM5EXb8PtsAI7YAByxAThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE44idfpm3+JDOTT5qZfNLM5EXbvJiZvGibFzOTT5qZfFLbvJiZfFLbfNIG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIDcARG4AjfnLczOSbtM1lbfNN2ubFzOSbtM2LmcmLmcmLtnkxM/kmG4AjNgBHbACO2AAcsQE4YgNwxAbgiA3AERuAIzYAR2wAjvgJ/2pt82Jm8qJtPmlm8qJtXsxMvknbvJiZvJiZvGibb7IBOGIDcMQG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIn/CvNjN50TbfpG2+Sdu8mJl8Utt80szkRdt80gbgiA3AERuAIzYAR2wAjtgAHLEBOGIDcMQG4IgNwBEbgCN+clzb8Nfa5sXM5E/SNi9mJi/a5sXM5Ju0zTfZAByxAThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxE++zMyEf07bvJiZfJO2+aS2eTEzedE232Rm8qJtPmkDcMQG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIDcAR018CcMAG4IgNwBEbgCM2AEdsAI7YAByxAThiA3DEBuCIDcARG4AjNgBHbACO2AAcsQE4YgNwxAbgiA3AERuAIzYAR2wAjtgAHLEBOOI/9pg5Xo1fa3oAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
47	51	Finca La Montaña	Vereda Agua Bonita - Pereira	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
48	52	Hacienda El Porvenir	Corregimiento La Florida - Tulúa	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
49	53	Finca Los Guaduales	Vereda El Silencio - Riosucio	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWASURBVO3BQY4chxEEwKzC/P/LZV4E6CIDbbDNSW1EzP0SgAIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxmwu9zd3nTzORNd5dvMjPh97m7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL3N3+UlmJm+amTxxd3liZvKmmckTd5c33V1+kpnJN9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3Mzkm9xdvsndpdndpdnM5JvcXZptAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8An8zM3nTzORNdxf+vTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6Bv7m7PDEzgf+XDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT8rdXfhnMxP+nLsLv88GoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX2Zmwp9zd3liZvLE3eWJmck3mZnw52wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzysrsL/GVm8k3uLvTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4hP9qZtLs7vLEzOSJu8sTM5NvMjN5093lm8xMnri7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYzedPd5YmZyZvuLt9kZvKmmckTd5c3zUz499oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjky9xdnpiZPHF3+SYzkzfdXd40M/kmd5cnZiZvmpm86e7yppnJE3eXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9ki8yM3ni7vLEzORNd5c3zUyeuLs8MTN54u7yppnJN7m7PDEzeeLuwj/bAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+yUvmpm86e7yxMwE/nJ3+SYzkyfuLj/JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+7u3yTu8tPMjNpdnfh95mZvOnu8qYNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYz4fe5u7zp7vLEzORNM5Mn7i78s7vLEzOTb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl7m7/CQzk2Z3lydmJm+amXyTu8sTd5cnZiZP3F2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFJuZvJN7i7NZiZP3F2euLu8aWbyxN3liZnJEzOTbzIzabYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPEJ/2p3lzfNTL7J3eWJmckTd5dvMjP5STYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6Bv5mZPHF3+SYzkzfNTJrdXZptAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Uu7uwp8zM3ni7vKmu8sTM5OfZGbyxN3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYm8L+amTxxd/kmM5NvMjN54u7ypg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiblfAlBgA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiP0CX4XclcpSYAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
50	54	Finca El Mirador	Vereda Las Brisas - Chinchiná	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAV1SURBVO3BQY4kiQ0EsJBQ//+yPAf7uIeEu7AZ0yTn/ghAgQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++bGbCz7m7vMnM5Im7y5vMTPg5d5dv2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ORl7i6/yczkN5mZPHF3eZO7y28yM3mTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT8rNTN7k7vImM5M3ubv8JjOTN7m7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPiEv9rd5YmZCbzVBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+XuLvSYmTxxd2l2d+HnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPIyMxN+zszkibvLEzOTJ+4uT8xMnri7fNPMhH/PBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDE3B+B/5qZvMndBf5nA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik19mZvJNd5cnZibfdHd54u7yxMzkibvLEzOTJ+4uzWYm33R3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3R15kZvJNd5cnZiZP3F2+aWbym9xdvmlmws+5u3zTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+XuLk/MTN5kZvLE3YUed5cnZiZP3F2emJk8cXd5kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibk/Umxm8sTd5YmZyTfdXZ6YmTxxd3liZvLE3eWJmcmb3F2emJl8092Ff7YBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3R/jXzEyeuLs8MTN54u7CP5uZNLu7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7I/y1ZibN7i5PzEy+6e7yJjOTN7m7fNMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnXzYz4efcXb7p7vImM5Mn7i5PzEzosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnL3F1+k5nJN91dnpiZPHF3eZOZyRN3lzeZmXzT3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+VmJm9yd3mTmckTd5c3ubs8MTN5YmbyxN3liZnJN91dvmlm8sTd5Zs2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+gf/DzOSb7i5P3F2emJm8yd3lTe4ub7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPEJf7W7yzfdXb5pZvImM5M3mZm8yd3lmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pd3fh58xMnri7PDEzeeLuwj+7u3zTzORNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnmZmQk9ZiZP3F2azUy+6e7yxMzkm+4ub7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3RwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/AdlePZFkTO4LgAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
51	55	Hacienda La Aurora	Corregimiento Naranjal - Manizales	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWSSURBVO3BMQ4DBRIEwJ6R///lOYILSAhWYsGNq2ruDwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZib8fe4uv2Rm8sTd5YmZCX+fu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPvkyd5dfMjN508zkibvLEzOTJ+4uze4uv2Rm8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTcz+SZ3l19yd3liZvLE3aXZzOSb3F2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfAJ/MjN54u4C/5QNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP4E/uLt9kZvLE3YX/rg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/K3V3gW91d+PtsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88mVmJvSYmTxxd3liZvJNZib8ezYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeb+EPi/mckTd5cnZiZvurvw37UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJuZnJE3eXN81M+Gt3lydmJk/MTJ64uzwxM/kld5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZiZvurs0u7t8k5nJEzOTb3J3+SZ3lydmJk/cXX7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ1/m7vKmmck3mZn8krvLm2YmT9xd3jQzeeLu8sTM5Im7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXnZ3edPM5Im7y5tmJk/cXZ6Ymbzp7vLEzKTZzORNd5c33V1+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5nw12YmT9xdnpiZPDEz+SV3lydmJk/MTL7J3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+7u/ySu8svubs8MTN54u7yTe4ub5qZPHF3+SUbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxmwt/n7vJNZiZP3F2+yczkibvLN5mZvOnu8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU++TJ3l18yM/kmd5cnZiZvmpk8cXf5JjOTN91d3jQzeeLu8qYNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPys1Mvsnd5ZvcXZ6YmbxpZvKmmcmb7i5P3F2emJm8aWbSbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4hP4B91dnpiZ/JK7y5vuLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+4T9tZvLE3eWJmcmb7i5vmpk8MTP5JneXJ2Ymb7q7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcncX/trd5YmZSbOZyRN3l28yM/kmd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXmZnw77m7vGlm8sTd5ZvMTN50d/kmM5Mn7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPtDAApsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr8DyRP8mkzvd7GAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
52	56	Finca El Paraíso	Vereda Horizontes - Calarcá	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
53	57	Finca La Primavera	Vereda El Bosque - Filandia	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWDSURBVO3BQY4chxEEwKzC/P/LZV4E6EIDbbOhSW1EzP0SgAIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxmwp9zd/kmM5M33V3eNDPhz7m7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL3N3+UlmJm+amTxxd3ni7vLEzKTZ3eUnmZl8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/KzUy+yd0F/jIz+SZ3l2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfwN/MTOBbbQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfAL/h7vLEzMT+F9tAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Uu7uwp9zd3liZvLE3eUnubvw52wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYm8JeZyRN3lzfNTPjnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPKyuwv/nLvLEzOTJ+4uze4u9NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3MzkibvLm2Ymze4uzWYmT9xdnpiZ/CR3l2+yASixASixASixASixASixASixASixASixASixASixASjxyQ8zM3nT3YXfm5n8JHeXZjOTJ+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkZTOTJ+4uzWYmb7q7NLu7vGlm8k1mJk/cXZ6Ymbzp7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZ3aXZ3eWJmckTd5cnZibf5O7yxMzkibvLm2Ymb7q7fJO7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5X8JvzUyeuLs8MTN54u7yxMzkTXeXN81MfpK7C7+3ASixASixASixASixASixASixASixASixASixASixASjxCf/V3eVNd5dvcnd5YmbyprvLm2YmT9xd3jQzeeLu8pNsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/ZIXzUz4c+4uT8xM3nR3eWJm8k3uLj/JzOSJu8s32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTL3F1+kplJs5nJE3eXN81MnpiZPHF3eWJm8qa7yxN3lydmJk/cXd60ASixASixASixASixASixASixASixASixASixASixASjxSbmZyTe5u3yTu8sTM5M3zUy+yd3lTXeXJ2Ymb5qZNNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPgE/ubu8sTM5Im7y5tmJk/MTJ64u3yTmckTd5dmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn/CvNjN5092l2d3liZlJs5nJm+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3N2F37u7NJuZfJO7y5tmJk/cXZ6YmTxxd/kmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASc7/kRTMT/py7C783M2l2d3liZvJN7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPslAAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACX+A5Lh/Uao3GpDAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
54	58	Finca Duplicada	Vereda Cualquiera	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
55	59	Los andes	Vereda El Camino - Pereira	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
68	72	Finca La Montaña	R. LA ESPERANZA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
56	60	Finca Las Orquídeas	Vereda Cristalina	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXcSURBVO3BwZEcgQ0EsCZr80+ZVgJ6jOvG3tYBmPsjAAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhJ9zd3liZvLE3eVNM5M33V2emJnwc+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjky9xdfpOZyZvuLk/MTN50d2l2d/lNZibfZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNyM5Nvcndpdnd5YmbC381MvsndpdkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn/NNmJt9kZvKmuwv/rg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/4p91d3jQzgf+VDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT8rdXfg5M5M33V1+k7sLP2cDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTLzMz4efMTJ64uzwxM3nTzOSJu8ubZib8/2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9EfgvzUy+yd2Ff9cGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5WYmT9xdnpiZfJO7yxMzkyfuLs1mJk/cXb7JzOSJu8ubZiZP3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZiZvurs8MTN5093lTTOTJ+4u3+Tuwt/dXZ6YmTxxd3ni7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZ3eWJmcmb7i7fZGbyxN3lTTOTbzIzeeLu8sTM5Im7yxMzkyfuLvzdBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmTxxd3nTzORNd5cn7i7f5O7yxMyk2d3lTXeXJ2YmT9xdnpiZPHF3+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzf+QXmZk8cXd5YmbyprvLEzOTZneXJ2Ymb7q7PDEzeeLu8k1mJk/cXd60ASixASixASixASixASixASixASixASixASixASixASjxyS9zd3nT3aXZ3eVNM5MnZiZP3F3eNDN54u7Cz9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkZTMTfs7d5Ym7yxMzk29yd3liZvLE3eWbzEyeuLu86e7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MneX32Rm8qaZSbOZyZtmJm+amXyTmcmb7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczOSb3F2a3V2emJk8cXd5YmbyprvLEzOTJ+4ub5qZPHF3eWJm8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+4Z92d3liZvLE3YWfMzN54u7yxMzkibvLN9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPiEf9rM5Im7yxMzkzfdXd40M3ni7vLEzOSJu8ub7i5PzEyeuLu8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNydxf+7u7ym8xM3jQzeeLu8sTM5Im7y5vuLt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky8zM+H/Z2byprvLEzOTJ+4u32Rm8qaZyRN3lydmJk/cXd60ASixASixASixASixASixASixASixASixASixASixASgx90cACmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvwH7YMgZRBIA6sAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
69	73	Finca La Molienda	LOS ALETONES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
70	74	Finca La Quinta	LA UNION	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
71	75	Finca La Candelaria	LOS ALETONES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAW0SURBVO3BQa4c2A0EsJLw739lxZsBssniAe5Ml01y7pcAFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjJh81M+H3uLi9mJt/k7vJiZvLi7vJiZsLvc3f5pA1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ98mbvL32Rm8k3uLi9mJi9mJs3uLn+Tmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+Em5mck3ubt8k7vLi5nJJ91dXsxMms1MvsndpdkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMRP+KPNTF7cXT5pZvLi7gL/2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+An8l5kJfKsNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImflLu78Oeamby4u3yTuwu/zwagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxE++zMyEf8/d5cXM5MXd5cXM5JvMTPj3bABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKzP0S+D+Zmby4u8A/NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlfvKXmZm8uLt80szkxd3lk2Ymn3R3eTEzeXF3+aSZyTe5u7yYmXzS3eWTNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlfvJhM5NmM5MXd5cXd5dPmpm8uLu8mJl8k5nJN7m78PtsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/ZJiM5MXd5dvMjP5pLvLi5nJi7vLN5mZvLi7vJiZfNLd5cXM5JPuLt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJx82M3lxd/kmM5MXd5cXd5dPmpl80szkm9xd+H1mJi/uLp+0ASixASixASixASixASixASixASixASixASixASixASjxk7/MzOSTZiafdHd5cXd5MTP5pLvLi5lJs7vLi5nJi7vLJ81MvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcL+GPNTNpdnf5pJnJi7vLi5nJi7vLi5nJJ91dvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMRPPmxmwu9zd3lxd/kmM5NPmpk0m5l80t2l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxE++zN3lbzIz+ZvcXV7MTD7p7vJJd5dvMjP5pLvLJ20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvyk3Mzkm9xd/iYzkxd3lxd3lxczkxczkxd3l0+amfC/bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/IQ/2szkxd3lxd3lbzIzeXF3eXF3+aSZSbMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImf8Ee7u7yYmby4u3yTu8snzUy+yczkxd3lxczkm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvyk3N2FP9fM5MXd5cXM5JvMTF7cXV7MTF7cXb7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET77MzIR/z93lxczkxd3lxd3lxczkxd3lxczkm8xMXtxdmm0ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9EoACG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4AS/wHd9gB8GBKOYgAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
72	76	Finca El Altamira	LA PRADERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
73	77	Finca La Planada	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWySURBVO3BMY4cgQ0EwCax//8yrcSAEwUD3EDbvqqa+yMABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT552cyEn3N3edPM5Im7yxMzkyfuLm+amfBz7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTL3F1+k5lJs5nJb3J3+U1mJt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3Izk29yd/kmM5Mn7i5PzEyeuLs8MTN54u7yTWYm3+Tu0mwDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIT+GJ3F/ivDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/i/dnd5YmYC32oDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcncXfs7d5U0zkyfuLs3uLvycDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77MzISfMzN54u7yxMzkibvLEzOTJ+4ub5qZ8O9sAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88rK7C//O3eWJmclvcnehxwagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCe/zMzkTXeXJ2Ymb7q7PHF3edPMhL+bmbzp7tJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Bi7o/wVzOTN91dnpiZfJO7y5tmJk/cXZ6YmXyTu8ubZiZP3F2+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5k8cXf5JneXJ2YmT8xMnri7PDEzeeLu8sTM5Im7y5tmJk/cXZ6YmTxxd3nTzOQ32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPsjL5qZvOnu8sTM5E13l2Yzk29yd3liZsLf3V2emJk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCdf5u7yxMzkTXeXJ2Ymze4uT8xMnri7PDEzedPd5YmZCf/OBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+7u7zp7vJN7i7fZGbym9xd3nR3edPM5Im7yxMzk2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxmws+5u7xpZvLE3eWJmck3mZk8cXd5092Fv9sAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjky9xdfpOZyZvuLm+amTxxd3liZvKbzEzedHdptgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5mck3ubt8k5kJ/87M5Im7yxMzkzfNTJ64u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiE/gfd5c3zUyeuLu86e7yTWYm3+Tu8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+4f/a3eWJmckTd5cn7i7NZiZvuru8aWbyprvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pd3ehx8zkibvLN7m7fJOZyRN3lydmJt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky8zM+Hfubs8MTP5JjOTJ+4uT8xM3nR3edPM5Im7yzfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+yMABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJf4DOaYLZaRoHHMAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
74	78	Finca La Cascada	LA PRADERA	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWSSURBVO3BQY4kBw4EsJBQ//+ydg6++pCLLjhjmuTcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXzUz4OXeXJ2YmT9xdvmlm8k13lydmJvycu8s3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPIyd5ffZGbyTXeXJ2Ym33R3eWJm8iZ3l99kZvImG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5SbmbzJ3aXZ3eWbZia/yczkTe4uzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT7hrzYzeZO7C/y/NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPuGvdnd5YmYCb7UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJubsLf6+ZyRN3lze5u/BzNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnmZmQk/Z2byxN3liZnJbzIz4b+zASixASixASixASixASixASixASixASixASixASixASgx90fgHzOTZncX/l4bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflJuZPHF3eWJm8iZ3lydmJk/cXZ6YmTxxd/mmmckTd5c3mZk8cXf5ppnJE3eXb9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7I8VmJm9yd3mTmUmzu8ubzEyeuLt808zkm+4ub7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl81MfpOZyZvcXd5kZsJ/5+7yxMzkibvLN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u7ym8xMnpiZPHF3+aa7yxMzkyfuLm8yM3ni7sK/2wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPsjLzIzeeLu8k0zE37O3eWbZiZvcnfh52wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyMneXN7m7NJuZPHF3eWJm0uzu8pvMTJ64u7zJBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ182M+Hn3F2euLu8yczkibvLN81Mnri7PDEzeZO7yxMzkyfuLt+0ASixASixASixASixASixASixASixASixASixASixASjxycvcXX6Tmck3zUyeuLv8JneXb7q7vMnMpNkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5WYmb3J3ocfM5Im7yxMzkze5uzwxM3mTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/ir3V2azUy+6e7yxMzkibvLEzOTJ+4uT8xMnri7vMkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn/NVmJm9yd+Hf3V2emJk8cXd5YmbyxN3lmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pd3fh391d3mRm8iZ3l2+amXzT3eWb7i5vsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLzEz478xMnri7fNPd5YmZyRMzk2+6u3zTzOSJu8sTM5Mn7i7ftAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdHAApsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr8DzsG/VKs67Y+AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
75	79	Finca El Vergel	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
76	80	Finca La Esperanza	LOS ANGELES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWuSURBVO3BMZIcgQ0EsCZr//9lWoEDJwrGdVPalgDM/RKAAhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp+8bGbCz7m7fJOZyTe5uzwxM+Hn3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXubv8S2Ymb5qZPHF3edPdpdnd5V8yM/kmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5SbmXyTu0uzmQk/Z2byTe4uzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6BLzYzeeLuwt9rA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiE/gfd5cnZiZPzEzg/7UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJubsLP2dm8sTdhd+7u/BzNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPvkyMxP+nLvLEzOTJ+4uT8xMnri7vGlmwp+zASixASixASixASixASixASixASixASixASixASixASgx90vgv2YmT9xdnpiZvOnuwt9rA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3IzkyfuLm+amTS7uzwxM3ni7vKmmckTd5cnZib/krvLN9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkZTOTbzIzeeLu8sTdhT/n7vLEzOSJu8ubZiZP3F2emJk02wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ORld5cnZiZvurs8MTN54u7yxMzkibvLEzOTJ+4uT9xdvsnMhN+7uzwxM3ni7vKmDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT142M3nT3eWJmck3ubu86e7yxMzkTXeXb3J3edPM5E0zkyfuLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednd5YmZSbOZyTe5uzxxd3liZsLv3V2emJm8aWbyxN3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9Ev5aM5Nmd5cnZiZP3F2emJk8cXd508zkm9xd3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJy2Ym/Jy7y5vuLt9kZvLE3eWJmcmbZib8nA1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++zN3lXzIzaTYz+SYzk29yd3liZvLE3eVNM5NvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5mck3ubt8k7vLm+4uT8xMnri7PDEz+SYzkyfuLm+amTTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4BP7HzORNd5c33V34vbtLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/4q81Mnri7vGlm8sTd5YmZyRN3l28yM2l2d3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+XuLvze3eVNM5M3zUyeuLs8MTN54u7yxMzkibvLm2YmT9xdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX2Zmwp8zM3ni7vLEzOSb3F3edHd5YmbyTWYmT9xd3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3SwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/AcvQwJ0fPGGpwAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
77	81	Finca El Triunfo	LA SOLEDAD	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
78	82	Finca El Guamo	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXaSURBVO3BgY0k1o4EsJIw+aescwL+wAO2z107JOf+EYACG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASP/mwmQl/zt3lxczkxd3lxczkxd3lm8xM+HPuLp+0ASixASixASixASixASixASixASixASixASixASixASjxky9zd/lNZiafdHd5MTPh391dfpOZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4SbmZyTe5uzS7u7yYmXzSzOTF3eWbzEy+yd2l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxE/4q81M4G+xASixASixASixASixASixASixASixASixASixASixASjxE/5qd5dPmpnA/5cNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImflLu70GNm8uLu0uzuwp+zASixASixASixASixASixASixASixASixASixASixASjxky8zM+HPmZm8uLt80t3lxczkxd3lk2Ym/Hc2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACV+8mF3F/47d5cXM5Pf5O5Cjw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ+Um5m8uLu8mJl8k7vLi5nJi7tLs5nJi7vLN5mZvLi7fNLM5MXd5ZM2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXm/pEPmpm8uLs0m5m8uLu8mJm8uLu8mJl80t3lk2Ym3+Tu8mJm8uLu8ptsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr85MPuLi9mJi/uLs1mJi/uLp90d3kxM/kmd5cXM5NmM5MXd5cXM5MXd5dP2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+MmHzUxe3F1ezEw+6e7ySXeXFzOTF3eXFzOTF3eXbzIzeXF3eTEzeTEz+aS7y2+yASixASixASixASixASixASixASixASixASixASixASjxE/6nmcmLu8uLmck3ubu8mJm8uLt8k5nJJ91dXsxM+HcbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJz/wh/rZnJJ91dXsxMXtxdPmlm8uLu8kkzkxd3l99kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJx82M+HPubu8uLu8mJl80t3lxcyk2czkxd3lm8xMXtxdPmkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOInX+bu8pvMTD5pZvLi7vJiZvJN7i4vZiafdHf5pJnJb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTcjOTb3J3+U3uLp80M3kxM/kmM5MXd5dPuru8mJl8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ/wV7u7vJiZfNLd5cXd5ZvMTF7cXV7MTF7cXV7MTF7cXb7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET/irzUw+6e7ySTOTF3eXFzOTb3J3eTEzeXF3eTEzeXF3+aQNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImflLu78O/uLi9mJs1mJt9kZvJJd5dPurt8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ98mZkJ/527yyfNTF7cXb7JzOTF3eWTZiYv7i4vZiYv7i6ftAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfePABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4P/QaGnGd11FAAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
79	83	Finca El Descanso	LOS ALETONES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
80	84	Finca San Felipe	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
81	85	Finca La Ponderosa	LA SOLEDAD	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
82	86	Finca El Vergel Verde	LOS ANGELES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXGSURBVO3BMZIcwJEEsKyK/f+X6+jIlNERnNMkF8DcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ZMPm5nw99xdXsxMfpO7y4uZCX/P3eWTNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlfvJl7i6/yczkk+4unzQzeXF3eTEz+SZ3l99kZvJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlflJuZvJN7i7NZiYv7i78dzOTb3J3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPET/mkzk2Z3F/iPDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJn/BPu7u8mJm8mJl8k7sL/64NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImflLu78L9zd3kxM/lN7i78PRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/5MjMT/p6ZyYu7y4uZyYu7y4uZyTeZmfC/swEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdH4P/JzOST7i78uzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX5Sbmby4u7yYmbyTe4uL2Ymze4uL2YmL+4u32Rm8uLu8kkzkxd3l0/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4Sbm7y4uZyYu7C//d3eXFzOST7i4vZiYv7i7fZGby4u7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6PfJGZSbO7y4uZyYu7S7OZyYu7S7OZSbO7yzfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+yMfNDP5Te4u32Rm8uLu8mJm8uLu8mJm8uLu8mJm8uLu8kkzkxd3lxczk0+6u3zSBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET36Zu8uLmcmLmclvcnd5MTN5cXd5MTN5cXf5pJnJi7vLi5nJb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTD7u7NLu7NJuZfNLM5JvcXV7MTD7p7tLs7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v7IB81M+HvuLr/JzOTF3eWTZiYv7i78PRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/5MneX32Rm8kkzk0+6u3zS3aXZzOST7i4vZiafdHf5pA1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ+Um5l8k7vLbzIzeXF3+aSZyTe5u3yTu8uLmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+An/tLvLi5nJi7vLi5nJi7vLJ91dXsxMPmlm8k3uLt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJ/zTZiafNDN5cXf5pLvLi5nJi7vLi5nJi7vLi5nJi7vLi5nJi7vLJ20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvyk3N2F/+7u8mJm8kkzk0+6u7y4u7yYmby4u7yYmby4u3zS3eWbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/OTLzEzocXf5pJnJi5nJi7vLi7vLi5lJs5nJi7vLJ20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9EYACG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4AS/wf3OxxaSlRvUgAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
83	87	Finca Villa Nueva	LA PRADERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
84	88	Finca La Palomera	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWqSURBVO3BMY4kiREEsMhE///LqTN0gJwzSpiSOnZIzv0lAAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhJ9zd/kmM5M33V3eNDPh59xd3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl7m7/CYzE/7ZzOSJu8ub7i6/yczkm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxSbmbyTe4u32Rm8sTd5Ym7yxMzkyfuLs1mJt/k7tJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiE/gPM5M33V2emJk8cXfhz7UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPEJf7S7y5tmJk/MTOC/tQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5uwt/rrtLs7sLP2cDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTLzMz4efMTJ64u7zp7vLEzOSJu8ubZib8/2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9JfBvM5NvcneBv20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyy8xM3nR3eWJm8qa7yxN3lzfNTPhnM5M33V2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPKymckTd5cnZiZvurs8MTN54u7yppnJN7m7PDEzedPd5YmZyZvuLt9kZvLE3eVNG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn7zs7vLEzOSJu8sTM5NvMjN54u7yxN3liZnJm2YmT9xdmt1dnpiZPHF3eWJm0mwDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLuLyk2M3ni7vKbzEzedHd5YmbyprvLEzOT3+Tu8sTM5Im7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednM5Im7yxN3l2YzkyfuLs3uLvycu8tvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnL7i78s7vLN7m7vGlm8sTd5YmZyZvuLm+ambxpZtJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fNTPg5d5c3zUyeuLt8k7vLbzIz+U02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU++TJ3l99kZvKmu8ubZibfZGbyprvLm+4uT8xMnri7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3Mzkm9xdvsnM5Im7yxN3lydmJm+6uzwxM3nTzORNd5c3zUyeuLu8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4hP4H7q7PDEzeeLuws+5u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/ij3V2emJm86e7yxN3lTXeXJ2Ym32Rm8k3uLm/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzdhZ9zd3liZvKmmcmb7i5P3F2+yczkibvLEzOTb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl5mZwN/uLm+amXyTu8ubZiZP3F2+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNxfAlBgA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiX73DDla9LlF1AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
85	89	Finca La Estancia	LAS DELICIAS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
86	90	Finca El Palmar	Bellavista	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
87	91	Finca El Tabacal	La Quisaya	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
88	92	Finca La Hacienda	ALTO SAN LUIS	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWRSURBVO3BMZYshw0EsCLf3P/K9E8UOmh7W5rSApj7IwAFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZzISfc3f5JjOTb3J3eWJmws+5u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky9zd/lNZibfZGbyxN3liZlJs7vLbzIz+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflJuZfJO7yzeZmTxxd3liZsJ/NzP5JneXZhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/A3+ju8sTMBP6yASixASixASixASixASixASixASixASixASixASixASjxCf9qd5dvMjOB/9UGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5e4u/JyZyRN3lydmJr/J3YWfswEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXmZnwc2YmT9xdnpiZPHF3eWJm8k1mJvxzNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v4I/E1mJk/cXeAvG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn/wyM5M33V2emJm86e7yppkJP2dm8qa7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYzeeLu8qa7y5tmJk/cXZ6YmXyTu8s3mZk0u7u8aWbyxN3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxSbmbyxN3lTXeXJ2YmT9xdnpiZ8N/dXZ6YmTxxd3nTzOQ32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTc3eWJmckTd5cnZiZP3F2emJk0u7s8MTN54u7yxMzkTTOTb3J3eWJm8sTd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKf/DJ3lydmJk/cXZ6YmTxxd/kmMxP4u2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9Ef61ZiZP3F2emJm86e7yxMzkibvLN5mZPHF3eWJm8qa7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhJ9zd3nTzOQ3mZk8cXf5JjOT32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL3N3+U1mJm+6uzwxM3nT3YWfc3f5TTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzP5JneXbzIzedPd5YmZyZvuLk/MTN40M3nTzOSJu8sTM5Mn7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+AT+DzOTZneXZneXN91dvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn/KvdXZ6Ymbzp7vJNZibf5O7yxMzkm9xd3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJubsLPWYmb7q7PHF3+SYzkzfdXZ6YmXyTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77MzIR/zt3liZnJE3eXJ2Ym32Rm8qa7yxMzkydmJk/cXb7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDE3B8BKLABKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPEfqYjqdwpnUQ0AAAAASUVORK5CYII=	\N	\N	ACTIVO	1
89	93	Finca El Roble	EL DIAMANTE	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWSSURBVO3BMZIghw0EsCZr//9l+gKryomCsTXWtA7A3C8BKLABKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTl81M+OvcXb5kZvIld5cnZib8de4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjJx9xdficzkzfNTL7k7tLs7vI7mZl8yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxE/KzUy+5O7S7O7yJTOTJ+4uXzIz+ZK7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImfwP9gZvKmuwv8YQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4ifwf3R3gf/WBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDET8rdXfjnmpk8cXf5krsLf50NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImffMzMBL5qZsLfZwNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6XwL/NTJ64uzwxM3ni7gJ/2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+Em5mckTd5c3zUya3V2azUyeuLs8MTP5ndxdvmQDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLulxSbmbzp7vIlM5Mvubu8aWbyxN3lTTOTJ+4ub5qZfMnd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBI/+ZiZSbOZyZvuLm+amfxOZiZvmpk8cXd5092l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwv+Y3MTJ64u3zJzOSJu8ubZiZP3F3eNDN54u7yxMzkibtLs5nJE3eXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvzkY2YmT9xdms1M3jQzeeLu8sTd5YmZyRN3l2Yzky+5uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+yX8Y81MvuTu8sTM5EvuLm+ambzp7tJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJy+bmfDXubt8yd3liZkJf+7u8sTM5ImZyRN3ly/ZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4ycfcXX4nM5Mvubs8MTPhz81Mnri7vOnu8sTM5Im7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACV+Um5m8iV3ly+5uzwxM3nT3eVNM5Mn7i5vurt8ycyk2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxE/gP9xd3jQzedPd5YmZyRN3lzfNTN50d2m2ASixASixASixASixASixASixASixASixASixASixASjxE/7RZiZP3F2emJl8yczkTTOTN91dnpiZPDEzedPd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBI/KXd34c/dXZ6Ymbzp7vLEzOSJu8sTM5Mn7i5vmpk8cXd5YmbyxN3lSzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX7yMTMT/j53lzfNTL7k7vLEzORNd5cvmZk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwvASiwASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASjxL1hf+1dkzac4AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
90	94	Finca La Unión	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
91	95	Finca La Trinidad	LAS DELICIAS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
92	96	Finca La Cañada	AGUA DULCE	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWQSURBVO3BMZIkiQ0EsCSj//9lag0ZcmSUYkrXuQNg7o8AFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkZTMTfs7dhZ8zM+Hn3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXubv8JjOT32Rm8sTd5ZvcXX6Tmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczOSb3F2+yczkm9xdfpOZyTe5uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4BP7D3eWJmckTM5M33V34e20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzCX+3u8sTM5E13F/hfbQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFLu7sLPubu8aWbyprvLN7m78HM2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU++TIzE37OzOSJu8sTM5Mn7i5PzEy+ycyEf84GoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcH4F/m5k8cXeB/5cNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPfpmZyZvuLk/MTN50d2k2M3ni7tJsZvKmu0uzDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJuT/yopnJE3eXJ2Ymb7q7fJOZyZvuLr/JzOSJu8sTM5M33V3eNDN54u7ypg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++zMzkibvLEzOTbzIzeeLu8qaZyRN3lydmJk/cXX6Tu8sTM5Mn7i7NNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZ3aXZzOSJu8sTd5cnZiZP3F3eNDN54u7yxMyk2d3lm8xMmm0ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9kWIzk9/k7vJNZiZvurv8JjOTb3J3+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzf4S/1syE/+7u8sTM5Im7yxMzkyfuLk/MTN50d3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmfBz7i7f5O7yxMzkibtLs5nJE3eXJ2Ymb7q7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPvszd5TeZmbzp7sJ/NzP5JjOTJ+4uv8kGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5WYm3+Tu8k1mJm+6u7xpZtLs7tJsZvLE3eVNG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn8AXu7s8MTN5093liZnJm+4ub7q7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP+KvdXZ6Ymbzp7vLEzKTZ3eWJmckTM5Nvcnd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfl7i78c2YmT9xdnri7NJuZPHF3eWJm8sTd5YmZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvMTPjn3F3eNDN54u7S7O7yTWYmT9xdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8S+vsgFXwu3VMgAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
93	97	Finca La Maravilla	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAV5SURBVO3BMY4ECW4EwCTR//8yNY6Ac9aow5TUuRMRcz8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTl81M+D13lzfNTJrdXZ6YmfB77i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTL3F3+kpnJm2Ymb7q7PDEzeeLu8k3uLn/JzOSbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFJuZvJN7i7N7i78npnJN7m7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPgE/sPMBL7VBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ/DFZiZP3F3499oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3N2F33N3eWJm8qa7S7O7C79nA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky8zM+Hf6+7yxMzkibvLm2Ym/P/ZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+xH4L81M3nR3gf+1ASixASixASixASixASixASixASixASixASixASixASjxSbmZyRN3lzfNTP6Su8sTM5MnZiZvurs8MTP5S+4u32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLuR140M2l2d2k2M/lL7i5PzEzedHd508zkm9xd3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3I3/IzORNd5cnZiZvurt8k5kJ/+zu8sTM5Im7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5H/kiM5Mn7i5vmpm86e7yxMzkTXeXZjOTb3J3aTYzeeLu8qYNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5Hyk2M3ni7vKmmcmb7i5vmpl8k7vLm2Ymf8nd5YmZyRN3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Uu7u8k3uLt9kZvKmu8sTM5Nmd5c3zUy+yd3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9yItmJvyeu8sTM5Mn7i5PzEy+yd3lL5mZvOnu8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU++TJ3l79kZtLs7tJsZvLE3eWJmckTd5c33V2emJk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZibf5O7yTe4uT8xM3nR3edPM5Im7y5vuLk/MTJ64uzwxM2m2ASixASixASixASixASixASixASixASixASixASixASjxCfwfmpk8cXd54u7CP7u7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPiEf7WZyZvuLm+amfB7ZiZvuru8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNydxf+2d3lm8xMnri7PDEzeeLu0mxm8qa7yzfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+5EXzUz4PXeXN81Mnri7vGlmQo+7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXmfgSgwAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxP8AgHgEPI9rLtwAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
94	98	Finca El Cacao	EL PRADO	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXWSURBVO3BMZIkiQ0EsCSj//9lag25Z9TFltQ5A2DujwAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ORlMxP+nrvLEzOTN91d3jQzeeLu8sTMhL/n7vKmDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77M3eU3mZm86e7yxMyEf3Z3+U1mJt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3Izk29yd2l2d3liZvLE3eU3mZl8k7tLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/40WYmT9xd3jQzgX9rA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiE360u8sTM5M33V3g39oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3N2Fn2tm8sTd5ZvcXfh7NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPvkyMxP+npnJE3eXJ2Ymv8nMhP+fDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJuT8C/zUzeeLuAv8rG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5SbmTxxd3liZvJN7i5PzEyeuLu8aWbyTe4u32Rm8sTd5U0zkyfuLm/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45GUzkyfuLk/cXd50d3liZvLE3aXZzORNd5dvMjN54u7yxN3liZnJm+4u32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTLzMzeeLu8sTM5Im7yxN3lydmJk/cXd40M3nT3eWJmckTd5cnZibfZGbyprvLEzOTJ+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7I19kZvJN7i5PzEyeuLs8MTN54u7yppnJm+4u32Rm8k3uLm+amTxxd3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmbzp7vKmmckTd5cnZia/yd3lN7m7NLu7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5P8KPNTN54u7yxMzkibvLEzOTN91dfpOZyRN3l2+yASixASixASixASixASixASixASixASixASixASixASgx90deNDPh77m7vGlm8sTdpdnM5Im7yxMzk29yd3liZvLE3eVNG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn3yZu8tvMjN508zkibvLEzOTJ+4ub5qZPHF3edPd5YmZyZtmJs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTcz+SZ3l2YzkzfNTJ64uzSbmTxxd/kmM5NvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Qk/2t3lTTOTN81M3jQzedPd5YmZyTe5u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/jRZiZvurs0m5l8k7vLEzOTJ+4uT8xMnri7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcncX/tnd5YmZyZtmJk/cXZ6YmTxxd3liZvLEzORNd5c33V2+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCdfZmZCj5lJs5nJm+4ub5qZPHF3eWJm8sTd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzfwSgwAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxH8AzBsZbE6qAGQAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
95	99	Finca La Frescura	LOS TENDIDOS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
96	100	Finca El Sauce	SAN JOSE	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
97	101	Finca La Pradera	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
98	102	Finca El Tuparro	ALTO SAN LUIS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
99	103	Finca La Floresta	EL DIAMANTE	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
100	104	Finca La Alegría	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
101	105	Finca La Veranera	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
102	106	Finca El Cafetal	Bellavista	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
103	107	Finca El Limón	LOS ALETONES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
104	108	Finca San José	AGUA DULCE	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
105	109	Finca El Rincón	santa teresa	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXLSURBVO3BQQ4rVo4EsJLg+19Zk00DvcniYWLE1Z/k3F8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL5uZ8M+5u7yYmXzT3eWbZiYv7i4vZib8c+4u37QBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJj7m7/ElmJr/k7vJiZvJNd5dfcnf5k8xMfskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5WYmv+Tu8ie5u3zTzOTF3eWXzEx+yd2l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCf8T7u7vJiZfNPd5cXdBf5jA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiE/gvd5cXM5MXM5MXdxf4jw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/K3V34ezOTX3J3+ZPcXfjnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJjZib8e+4uL2Ym3zQzeXF3+aaZCf+eDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJub+E/1kzkxd3F/hVG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5SbmfySu8uLmcmLu8s3zUz459xdvmlm8kvuLt+0ASixASixASixASixASixASixASixASixASixASixASjxyY+ZmXzT3eWX3F2+6e7yYmbyTXeXFzOTF3eXFzOTF3eXb5qZvLi7vJiZNNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkDzMzeXF3eTEz+aa7yzfdXX7J3eXFzOTF3eXFzOTF3eWbZiYv7i4vZia/ZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pMvm5n8krvLi5nJN91dXsxMXtxdvmlm8uLu0uzu8k13F/7eBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDE3F9SbGbyTXeXFzOTb7q7vJiZ/JK7yy+ZmXzT3eWXzExe3F1+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfl7i6/5O7CP2dm8uLu8uLu8mJm8k0zkxd3lxd3l2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffNnMhH/O3eXF3eWbZibfdHd5MTP5prvLi5nJi7vLL5mZvLi7fNMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnP+bu8ieZmfySmcmLu8uLmcmLu8s33V1ezEz492wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxSbmbyS+4uv2Rm8uLu8mJm8k0zkxd3l2+6u7yYmbyYmby4u3zT3eWXbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfAL/ZWby4u7yYmbyS2Ym33R3eTEz4e9tAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Av8PM5Nvuru8mJm8uLu8mJl8093lxczkxd2l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfl7i78vbvLi5lJs7vLi5lJs7vLi5nJi7vLL9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkx8xM+PfcXV7MTF7cXb5pZvLi7vJiZvJLZiYv7i7NNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v4SgAIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBL/B7oPHVk5osCgAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
106	110	Finca El Paraíso	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWHSURBVO3BQY4khw0EwCTR//8yvRcDvshAGVNypyYi5v4IQIENQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYz4efcXX6TmckTd5cnZib8nLvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MneX32Rm0mxm8pvcXX6Tmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczOSb3F2+yczkibvLN7m7NJuZfJO7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP4G90d4H/1QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCf8o91dnpiZPHF3eWJm8sTdBf5tA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3J3F37O3eWJmckTd5ff5O7Cz9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjky8xM+DkzkyfuLt9kZvLE3eVNMxP+fzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeb+CPxNZiZP3F3g3zYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75ZWYmb7q7PDEzedPd5YmZyZvuLvy1mcmb7i7NNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPuG/uru86e7S7O7yppnJm+4ub5qZNJuZPHF3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnL5uZPHF3eWJm8k1mJs3uLm+amTxxd+Gv3V1+kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU9+mbvLEzOTJ+4ub5qZvGlm8sTdhb92d/kmM5NmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASc3/kF5mZPHF3eWJm8qa7yxMzkyfuLk/MTJrdXb7JzOSJu8sTM5Mn7i7fZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNf5u7yprvLb3J3eWJm0mxm8sTdpdnM5Im7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhJ9zd/kmM5Mn7i5PzEyeuLt8k5nJE3eXN91dmm0ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZe4uv8nM5E13lydmJk/cXfg5M5M33V2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFJuZvJN7i7fZGbyppnJE3eX3+Tu8sTM5Im7y5tmJk/cXd60ASixASixASixASixASixASixASixASixASixASixASjxCfyHu8sTM5M33V3eNDN54u7yxMzkibvLEzOTJ+4uT9xdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn/KPdXb7JzOSJu0uzu8ub7i5PzEzedHd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfl7i78nJlJs5nJE3eXN81Mnri7PDEzeeLu8sTM5JtsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88mVmJvBPcXf5JjOTJ+4u32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLujwAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+BfL/v9EPvHp3gAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
107	111	Finca La Fragancia	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWNSURBVO3BMZIcgQ0EsCZr//9lWqETBePSWNs6AHO/BKDABqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmfDn3F2emJm86e7yppnJE3eXJ2Ym/Dl3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88mXuLj/JzKTZzOQnubv8JDOTb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJuZnJN7m7fJO7y5tmJm+6uzSbmXyTu0uzDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/inzUyeuLs8cXd5YmYC/6sNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP4L/MTJ64u8D/ywagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfl7i78PTOTJ+4uT8xMnri7fJO7C3/OBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ19mZsLfc3d5Ymbyk8xM+Hs2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+edndhb/n7vLEzOQnubvQYwNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pMfZmbyxN3lTTOTJ+4uzWYmzWYm3+Tu8sTM5E13lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88rKZyTe5u3yTu8ubZib83szkibvLm2YmT8xMnri7PDEz+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffJm7yxMzkydmJs3uLk/cXZrNTN50d+H37i7fZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6XfJGZyRN3lzfNTJ64uzSbmTxxd3liZvLE3eVNM5Mn7i7NZiZP3F2+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwv+SIzkzfdXd40M/kmd5dmM5Nvcnd5YmbyxN3liZnJN7m7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL3N3aXZ3+SYzE37v7vLEzKTZ3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmfDn3F2euLs8MTNpdnd5YmbyprtLs5nJE3eXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZe4uP8nM5JvcXd40M3nTzOSbzEy+ycyk2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZibf5O7yk8xMvsnd5U0zkzfdXd40M2m2ASixASixASixASixASixASixASixASixASixASixASjxCf+0mcmb7i5vmpk8MTN54u7yprsLf84GoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn/NPuLk/MTJ6Ymfwkd5cnZiZP3F3edHd5YmbyTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pd3fh77m7vGlm8sTd5U0zk2YzkyfuLt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky8zM+HfNTN54u7yppnJE3eXJ2YmT8xMnri7PHF3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3SwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/Af9hPBr/ABTEAAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
108	112	Finca La Lomita	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
109	113	Finca El Guadual	AGUA DULCE	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXPSURBVO3BQRIjSG4EsCRD//8yvRcf91B2K0Y5DWDuPwJQYANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pMvm5nw59xdXsxM/iZ3lxczE/6cu8s3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJj7i5/k5nJN91dvmlm8uLu8mJm8kvuLn+Tmckv2QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczOSX3F1+ycyEf87M5JfcXZptAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8wr/a3eXFzOSbZiYv7i7wvzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT7hX21m8k13lxczkxczkxd3F/69NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPil3d+G/u7v8krvL3+Tuwp+zASixASixASixASixASixASixASixASixASixASixASjxyY+ZmfDnzExe3F1ezExe3F1ezExe3F2+aWbCP2cDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL7u78O91d3kxM3lxd/mmuws9NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPuGPmpl8093lxd2l2czkxd3lxczkxd3lxczkxd3lxczkxd3lxczkxd3lmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75spnJi7vLi5nJi7vLi5nJi7vLN81MXtxdmt1dvunu8mJm8kvuLi9mJi/uLr9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky+7u7yYmby4u7yYmfySmck3zUxe3F1ezExe3F2+aWby4u7yTXeXFzOTXzIzeXF3+aYNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPvmxm8uLu8k13lxczkxczkxd3l2+amfySmck33V1ezEx+yd3lxczkxd3lxczkl2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZXeXb5qZvLi7fNPd5cXM5MXd5cXd5ZvuLt80M3kxM/klMxP+nA1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibn/CP9aM5MXdxf+OTOTF3eXv8kGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnXzYz4c+5u7y4u7yYmby4u/ySmck33V1ezExe3F1+yczkxd3lmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MXeXv8nM5JtmJi/uLi9mJi/uLi9mJs3uLt80M3lxd3lxd/klG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5SbmfySu8svubu8mJk0u7u8mJl808yEP2cDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIT+GF3l2+6u3zT3eXFzIT/bgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4hP4f7i7vJiZfNPd5cXM5G8yM/mmu8s3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFLu7sI/Z2byTXeXFzOTF3eXXzIz+SV3l1+yASixASixASixASixASixASixASixASixASixASixASjxyY+ZmcD/1d3lxczkm+4uL+4uL2YmL+4uzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeb+IwAFNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl/gfjThlmQoJagAAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
110	114	Finca La Granja	EL DIAMANTE	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAV6SURBVO3BwYoshxEEwKxi/v+Xy+9i0EWGhm15UhsRc38EoMAGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnL5uZ8HPuLm+amTxxd3liZvKmu8sTMxN+zt3lTRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp98mbvLbzIzedPMhJ9zd/lNZibfZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNyM5Nvcnfh791dnpiZNJuZfJO7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP4C/uLk/MTOCfsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5uws97i6/yd2Fn7MBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl5mZwH/NTJ64u7xpZsL/zwagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwfgX/IzORNdxf+vTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeb+SLGZyRN3lzfNTJrdXb7JzORNd5cnZia/yd3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzC/zQzedPd5YmZSbOZyZvuLt/k7vKmmckTd5dmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASc3/kRTOTN91dnpiZPHF3eWJm8qa7y5tmJk/cXZ6YmfBz7i5vmpk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvu7s8MTP5JjOTN91d3jQzeeLu8qa7yxMzkyfuLm+amTxxd+HnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfMKPurs8MTN54u7yTWYmb7q7PDEzeeLu8qaZyTe5uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJSY+yP8a81Mnri7vGlm8sTd5YmZyZvuLm+amTxxd/lNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZzISfc3f5JjOTJ+4u/JyZyZvuLt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Diky9zd/lNZibfZGbyxN3liZnJE3eXN91d3jQzeeLu8k1mJk/cXd60ASixASixASixASixASixASixASixASixASixASixASjxSbmZyTe5u3yTu8sTM5M33V2emJk8cXd5YmbyxN3libvLm2Ymv8kGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn8Bd3lzfNTL7J3eWbzEyeuLv8JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/wrzYzeeLu8sTM5E13l28yM3nT3eVNM5M33V3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5uwt/7+7Cz7m7vGlm8sTd5U13l2+yASixASixASixASixASixASixASixASixASixASixASjxyZeZmdDj7vJNZibN7i5PzEzeNDN54u7ypg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibk/AlBgA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiP9lr+EMAxrN6AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
111	115	Finca El Cedro	Bellavista	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
112	116	Finca El Reposo	LOS ANGELES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXISURBVO3BQY4kBw4EsJBQ//+ydg6++pBA57pimuTcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZib8nLvLEzOTJ+4uv8nMhJ9zd3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ1/m7vKbzEzedHf5JjOTN91d3nR3+U1mJt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3Izk29yd/lNZiZP3F1+k5nJN7m7NNsAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPiEv9rM5E13lzfNTJ64u/D32gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+IS/2t3liZnJEzMT+H/ZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzdhZ9zd3liZsK/u7vwczYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MjMTfs7M5Im7y5vuLk/MTL7JzIT/zgagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwfgX/MTJ64uzwxM3nT3YW/1wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZiZP3F2emJl8k7vLEzOTJ+4u3+Tu8sTM5Im7yzeZmTxxd3nTzOSJu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPil3d/kmd5c3zUyeuLu8aWbSbGbyprvLE3eXJ2Ymb7q7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYz+U1mJt9kZvJN7i5PzEyeuLs8MTP5JjOTN91dnpiZPHF3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX+bu8sTMpNnd5YmZyRN3lydmJr/J3eWJmckTM5M33V1+kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/K3V2+yczkiZnJm2YmT9xdfpOZyZvuLs3uLt9kA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fdXX6Tu8s3mZm8aWbyxN3libvLN7m7NJuZPHF3+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxmws+5uzxxd3liZvJNZiZP3F2euLu8aWbyTe4uT8xMnri7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTL3N3+U1mJm+ambzp7vLEzORNM5Mn7i5vurs8MTN508yk2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZibf5O7Cz7m7PDEz+SYzk29yd3liZvJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPuGvdnd5YmbyxMzkN5mZPHF3eWJm8sTd5YmZyRN3l2+yASixASixASixASixASixASixASixASixASixASixASjxCX+1mckTd5c3zUyemJk8cXdpdnd5YmbyxN3liZnJE3eXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u7Cv7u7vGlm8sTd5U0zk28yM3nT3eVNd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXmZnw35mZPHF3+SZ3lzfNTJ64u7xpZvLE3eWJmckTd5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKzP0RgAIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBL/A76jCntlEGeMAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
113	117	Finca La Sabana	LA SOLEDAD	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
114	118	Finca San Carlos	LAS DELICIAS	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWnSURBVO3BQY4chxEEwKzC/P/LZR5sQBceWmZDk9qImPslAAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhD/n7vJNZiZP3F2emJk8cXd5YmbCn3N3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX+bu8pPMTN40M3ni7vKmmckTd5dvcnf5SWYm32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcjOTb3J3aTYzeeLu8qaZyRN3l28yM/kmd5dmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn8D/YWbyxN0F/q4NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP4C/uLk/MTJ6YmTxxd4H/2QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTc3YU/Z2byprvLEzOTJ+4u3+Tuwp+zASixASixASixASixASixASixASixASixASixASixASjxyZeZmfDPubs8MTP5SWYm/HM2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXmfgn818zkTXcX+Ls2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczeeLu8qaZyU9yd3nTzORNd5cnZiY/yd3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYmT9xdnpiZvOnu8qaZyRN3lydmJk/MTJ64u/wkd5c3zUzeNDN54u7ypg1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU9eNjN54u7yTe4uT8xMvsnM5Im7yxMzE35vZvLE3eVNd5dmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn3yZmUmzu8ubZiZP3F2a3V2emJk8MTN5093lTXeXN81Mnri7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTl91dnpiZPHF3eWJm8sTM5CeZmTxxd3liZvJN7i5PzEyemJl8k7tLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aiblfwr/WzKTZ3eVNM5Mn7i5vmpm86e7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pOXzUz4c+4u3+Tu8sTM5E0zk2Z3lydmJk/MTJ64u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77M3eUnmZl8k7vLEzOTN81M3nR3edPM5Im7yxN3lzfNTJ64u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3Izk29yd/kmd5c33V2+yczkm9xdvsnMpNkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn8BczkyfuLt/k7sLv3V2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfMK/2szkTTOTN91dvsnM5E13lzfNTN50d3nTBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+XuLvze3eWJmckTd5cnZibN7i4/yd3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYm/HPuLk/MTJ64uzwxM+H37i5vmpk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwvASiwASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASjxH8Ca/2I7fQPcAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
115	119	Finca El Guayabal	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
116	120	Finca El Naranjal	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWkSURBVO3BQY4kiQ0EsJBQ//+yPJcFfJlDAp12xTbJuT8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTl81M+Dl3l28yM3ni7vLEzOSJu8sTMxN+zt3lTRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp98mbvLbzIzedPM5JvMTJrdXX6Tmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczOSb3F2a3V2emJk8cXf5TWYm3+Tu0mwDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIT+C8zkzfNTJ64u8A/NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPil3d+Hn3F2emJk8cXd5YmbyxN3lm9xd+DkbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffJmZCXyrmQn/PxuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEnN/BKDABqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+VmJk/cXd40M/lN7i5vmpm86e7yxMzkN7m7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYzedPd5U0zkzfdXZ6YmTxxd3nTzKTZzOSJu8ubZiZvurs02wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTL3F3eNDN54u7yxMzkiZnJE3eXJ2Ymb7q7PDEz4e/uLk/MTJ6Ymbzp7vKmDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT152d3nTzOSJu8sTM5M33V2emJk8cXd508zkibvLm2YmT9xd3jQzeeLu8sTd5YmZSbMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5P/Kimck3ubt8k5nJN7m7fJOZyRN3lydmJk/cXd40M3ni7vLEzOSJu8s32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ORldxf+7u7yppnJm2YmT9xdms1Mnri7fJO7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5P/KimQk/5+7yxMzkTXeX32Rmwt/dXd60ASixASixASixASixASixASixASixASixASixASixASjxyZe5u/wmM5Nvcnd5YmbyprvLm2Ymb7q7PDEzeeLu8qaZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzM5JvcXb7J3aXZzORNd5cnZiZPzEzeNDP5TTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6B/6G7S7O7yzeZmTxxd2m2ASixASixASixASixASixASixASixASixASixASixASjxCf9qM5NvMjN5093liZnJE3eXN81M3jQzedPd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflLu78Hd3lydmJm+6uzwxM3liZvLE3eVNM5Mn7i5vmpk8cXf5JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp98mZkJ/14zkyfuLk/MTL7J3eWJmck3mZk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwfASiwASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASjxH7+0+mtoEAWtAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
117	121	Finca La Rivera	LOS TENDIDOS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
118	122	Finca La Oliva	SAN ANTONIO	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWLSURBVO3BMY4giQ0EsJIw//+yvIkBJw4a2MZ13ZCc+yMABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX7yspkJf8/d5YmZSbO7y5tmJvw9d5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/ORj7i6/yczkN7m7NLu7/CYzky/ZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4SbmZyZfcXb7k7vKmmckTM5M33V2+ZGbyJXeXZhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/hX21m8qa7yxMzkyfuLvBfG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASP4H/cXeBr9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPhJubsL/5yZyRN3l9/k7sLfswEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ZOPmZnAf81Mnri7vGlmwj9nA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJy+7u/DPubs8MTN54u7S7O5Cjw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiZ/8MjOTJ+4ub5qZPHF3+ZKZyZvuLl8yM/mSu8sTM5M33V3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ZOXzUz4/+4uv8nd5U0zkyfuLk/cXd40M3liZvLE3eWJmcmXbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/ORj7i5vmpk8MTOhx92Fv+fu8iUbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzf6TYzORNd5cvmZl8yd2l2czkibtLs5nJE3eXL9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjJx8xMnri7PDEz+ZKZyZvuLk/MTJ6YmTxxd3liZvKmu8ubZiZP3F2emJm8aWbyxN3lTRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/5mLvLm+4uX3J3edPM5Im7y5tmJm+6u7xpZtLs7tJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiJy+bmfD33F2euLs8MTNpNjN54u7yprvLEzOTL5mZPHF3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMRPPubu8pvMTL7k7tJsZvIlM5Mn7i5PzEyemJk02wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+Em5mcmX3F1+k5nJm+4uT9xdnpiZNLu7PDEzabYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPET/tVmJl9yd3liZvLE3eVL7i5vmpn8JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEj/hX+3u0uzu8sTM5Im7y5tmJk/cXZ64u7xpZvIlG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASPyl3d+HvmZl8yd3libvLEzOT32Rm8sTd5Us2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXm/siLZib8PXeXL5mZ/CZ3lydmJl9yd2m2ASixASixASixASixASixASixASixASixASixASixASgx90cACmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASvwHA9r5VgRUrG4AAAAASUVORK5CYII=	\N	\N	ACTIVO	1
119	123	Finca El Retiro	R. LA ESPERANZA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
120	124	Finca La Antigua	R. LA ESPERANZA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
121	125	Finca La Ceiba	MONO ALTA	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXCSURBVO3BMZIcgQ0EsCZr//9lWolDBePSWNs6AHO/BKDABqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmfDn3F2emJk8cXd508zkTXeXJ2Ym/Dl3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88mXuLj/JzORNd5cnZiZP3F2euLs0u7v8JDOTb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJuZnJN7m78HszkzfdXb7JzOSb3F2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfMI/bWbyppkJ/L9sAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8wj/t7vKmmckTdxf4X20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u7C33N3eWJm8qa7yze5u/DnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJlZib8OTOTJ+4uT8xMnri7PDEz+SYzE/6eDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT152d+Hvubs8MTN54u7S7O5Cjw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/KzUyeuLs8MTP5JneXJ2YmT9xdnpiZfJOZyRN3l28yM3ni7vKmmckTd5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFLu7vLEzOSJu8sTM5Mn7i7fZGbyprvLm2YmP8nM5Im7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYzeeLu8qa7yxMzkyfuLk/MTJ64u/wkM5Mn7i7fZGbyTWYmT9xdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcL3nRzORNd5cnZiZP3F2azUyeuLu8aWbyxN3lJ5mZPHF3eWJm8qa7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednd5U0zkyfuLm+amXyTuwt/z8zkibvLEzOTn2QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcneXb3J3+SYzkyfuLvzezOSJu0uzu8s32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ORlMxP+nLvLE3eXJ2YmT9xd3jQzeeLuwu/dXZptAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88mXuLj/JzORNM5Mn7i5PzEyeuLu8aWbyxN3lTTOTJ+4uT9xdnpiZvOnu8qYNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPys1Mvsnd5Se5u7xpZvKmmcmb7i7f5O7yxMzkm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzCP+3u8sTM5Im7yze5u7xpZvJNZiZvurt8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/4p81M3jQzedPd5YmZyZvuLk/MTL7J3eWJmckTd5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFLu7sLv3V3eNDN54u7SbGbyxN2l2d3lm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYm8F8zkyfuLt9kZvKmu8ubZiZP3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdLAApsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEr8Bx5uFmDiNC25AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
122	126	Finca La Cumbre	las delicias	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
123	127	Finca El Progreso	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
124	128	Finca La Ilusión	LA PRADERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
125	129	Finca El Jardín	EL PRADO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
126	130	Finca La Gloria	ALTO SAN LUIS	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWuSURBVO3BQZIchw0EwAJi/v9lmBdH6KJD22xxSpuZc78EoMAGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnL5uZ8PvcXd40M3ni7vLEzOSJu8ubZib8PneXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZe4uP8nM5E0zk29yd3liZvLE3eVNd5efZGbyTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzP5JneXn2Rm8sTd5Ym7S7OZyTe5uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4BP7i7vKmmckTdxf4rw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/g/zAzeeLuAv+rDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT8rdXfhz7i5PzEyeuLs0u7vw+2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYm9JiZPHF3eWJm8sTd5U0zE/6cDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJuV8C/5CZyZvuLvx7bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFJuZvLE3eVNM5Nmd5cnZiZP3F3eNDN54u7yxMzkJ7m7fJMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYzeeLu8k1mJm+6uzwxM3ni7vKmu8ubZiZP3F2+yd3lm8xMmm0ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9kh9kZvLE3eVNM5Nmd5cnZib8vbvLN5mZPHF3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX2Zm8pPcXZ6Ymbzp7vLEzOSJu8sTM5Mn7i5PzEzedHd508zkibtLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++zN3lTTOTN81MfpK7yzeZmTxxd3liZvLEzORNd5efZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6X8K81M/kmd5dvMjN54u7Cn7MBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJy2Ym/D53l29yd3nTzORNd5dvMjN54u7yxMzkibvLN9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjky9xdfpKZyTe5u7xpZvLE3aXZzORNM5Mn7i5PzEyeuLu8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNyM5Nvcnf5JneXJ2YmT9xdnri7PDEzeeLu8sTM5Im7yxN3lydmJk/cXZ6YmTTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4BP7i7vLEzOSJu8ubZiZP3F2azUyeuLs02wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+IR/tZnJE3eXJ+4uzWYm3+Tu8qaZyZvuLm/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzdhb93d3liZsLfu7u8aWbyxN3lTXeXb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl5mZ8OfcXb7JzOSJu8sTM5MnZiY/yczkibvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeZ+CUCBDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJ/wAnaA9Y+kVcgAAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
127	131	Finca El Rocío	LOS ALETONES	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAXISURBVO3BMa4cCw4EsJIw97+y1omBTRw04Maf8iM590sACmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyspkJf8/d5YmZyZvuLs1mJvw9d5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJl7i4/yczkm9xd3jQzedPd5U13l59kZvJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3M/kmd5dvcnd5YmbyxN2FP5uZfJO7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP+KfNTJ64uzwxM3ni7vLEzAR+2wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+AT+z8zkTTOTJ+4u8NsGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5e4u/D13lydmJk/cXX6Suwt/zwagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCdfZmYCv81Mnri7vGlmwn9nA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fdXfjv3F2emJn8JHcXemwASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyw8xMnri7vGlm8sTd5ZvcXZ6YmTxxd/kmM5Nvcnd5YmbyprvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT552czkibvLEzOTbzIzeeLu8qaZyTe5u7xpZvLE3eWJu8ubZiZPzEzedHf5JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEnO/5IvMTN50d3liZvJN7i5PzEzedHd508zkm9xdfpKZyRN3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/ZJiM5M33V2emJk8cXf5SWYm3+Tu8pPMTJ64u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT142M2k2M3ni7vLEzOSJu8s3mZk8cXd5YmbyxN3liZnJE3eXJ2YmT9xdvsnM5Im7y5s2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+edndhT+7u7xpZvKmu8tPMjN508zkTXeXZhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp+8bGbC33N3eeLu8sTM5JvcXZrdXZ6YmXyTmckTd5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJl7i4/ycyk2czkibvLN7m7PDEzeWJm8sTd5YmZyRMzk2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflJuZfJO7C382M3nT3eWJmck3mZk8cXd5YmbSbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4hP+aTOTJ+4ub5qZvGlm8k3uLm+amfwkG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn/BPu7s8MTN54u7yxN3lm8xMnri7PDEzeeLu8qa7yxMzk2+yASixASixASixASixASixASixASixASixASixASixASjxSbm7C3/P3eWJmckTd5cnZiZP3F3eNDP5JneXJ2YmT9xdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX2Zmwr9rZvLE3eWJmcmb7i5PzEzeNDN54u7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6XABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4H6F0C3oWo3qQAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
128	132	Finca El Recuerdo	LA SOLEDAD	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
129	133	Finca La Herrería	LOS TENDIDOS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
130	134	Finca La Ribera	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWDSURBVO3BQY4kiQ0EsJBQ//+yPIc14GvCndiKaZJzfwSgwAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5nwc+4u32Rm8qa7y5tmJvycu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPvkyd5ffZGbS7O7yxMzkiZnJE3eXN91dfpOZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzM5JvcXb7JzOSJu8sTM5Mn7i5PzEyazUy+yd2l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfwf7i7PDEzeeLuAv+1ASixASixASixASixASixASixASixASixASixASixASjxCX+1u8sTM5NvMjN54u7C32sDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcncX/l53l2Z3F37OBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ19mZsLPmZk8cXd5YmbyxN3liZnJE3eXN81M+PdsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/RH4x8zkibvLEzOTN91d+HttAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88svMTN50d3liZvKmu0uzu8tvMjN5092l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZibfZGbyxN3liZnJEzOTZjOTb3J3eWJm8sTd5ZvMTJ64u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fNTJ64u/wmM5M33V3oMTN5092l2QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvu7s8MTN5093lN5mZPHF3eWJm8qa7yxMzk29yd3liZvLE3eWJmUmzDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/hXzUyeuLs8cXf5JncXfs7M5E13l2+yASixASixASixASixASixASixASixASixASixASixASgx90f4a81MvsndpdnM5Im7y5tmJt/k7vKmDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT142M+Hn3F3edHfh58xMnri7fJO7yzfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvcXX6Tmcmb7i5PzEzedHd5Ymbym8xM3nR3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJuZnJN7m7fJOZyZvuLm+6u7xpZvKmu8ubZiZvmpk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfwP+4uT8xMmt1d3jQzaXZ3+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKf8Fe7u/wmd5dvcnd5YmbyppnJm+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3N2FnzMzeeLu8sTM5DeZmTxxd3liZvLE3eWJmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTLzEz4e91dvsnM5Im7yxN3l28yM3ni7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v4IQIENQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIn/AMeY81kF7STbAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
131	135	Finca El Corcel	MONO ALTA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
132	136	Finca El Totumo	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
133	137	Finca El Rancho	LAS DELICIAS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
134	138	Finca El Caimital	LOS ALETONES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
135	139	Finca La Reforma	SAN LUIS	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAV4SURBVO3BQY4kiQ0EsJBQ//+y3BcDe5lDGp3YCg/JuR8BKLABKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJy2Ym/J67yxMzkyfuLm+amTxxd3nTzITfc3d50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCdf5u7yN5mZfJOZCX92d/mbzEy+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZibf5O7Cn91d/iYzk29yd2m2ASixASixASixASixASixASixASixASixASixASixASjxCf/X7i5PzEzeNDN54u4C/7UBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPEJ/MPd5YmZyRN3F/hfbQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFLu7sKfzUyeuLs8cXd5YmbyprvLN7m78Hs2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU++TIzE3rMTJ64uzwxM/kmMxP+PRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp+87O4C3+ruQo8NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPys1Mvsnd5YmZyRN3l29yd3liZvLE3eWJmck3ubu8aWbyTe4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7kRfNTJ64u/DvmZk0u7u8aWbyxN3liZnJE3eXv8kGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcj/CvmZnwe+4u32Rm8k3uLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACXmfuRFM5Mn7i5PzEzedHd5YmbyxN3liZnJE3eXbzIz4c/uLk/MTL7J3eVNG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4AScz/Cr5mZvOnu8sTM5Im7yxMzk2Z3lzfNTN50d3nTzOSJu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5n6E/1szkyfuLt9kZvLE3eVvMjN54u7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pOXzUz4PXeXJ+4uT8xM3nR3eeLu8sTM5JvcXfg9G4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn3yZu8vfZGbS7O7yxMzkm9xd+LOZyRN3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Um5m8k3uLt9kZvLE3eVNd5c3zUyemJm86e7S7O7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6Bf5iZPHF3edPM5Im7yxMzE3psAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Av9wd2k2M3ni7vKmmckTdxf+bANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNydxf+7O7yxMzkm9xd3jQz+ZvMTJ64u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77MzIQed5cnZiZPzEyeuLs8cXd508zkm9xdmm0ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9CECBDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJ/wCHPfw7zaJFZQAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
136	140	Finca El Remanso	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
137	141	Finca La Colina	Las Minas	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWXSURBVO3BMa4cWA4EsJLw739lrcNNHLyBG9M1Jjn3SwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/OTDZib8OXeXFzOTF3eXFzOTT7q7fNLMhD/n7vJJG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASP/kyd5e/yczkm8xMXtxd/iZ3l7/JzOSbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/KTczOSb3F2a3V0+aWby4u7SbGbyTe4uzTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJX7Cf9rd5cXM5JPuLvBPbQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/KTc3YXfm5l80t3lxczkk+4u3+Tuwp+zASixASixASixASixASixASixASixASixASixASixASjxky8zM+Hfc3d5MTN5cXd5MTP5JjMT/j0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzv4T/rJnJN7m7wD+1ASixASixASixASixASixASixASixASixASixASixASjxk3Izk29yd3kxM3lxd+H3Zibf5O7ySTOTb3J3+aQNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImffNjM5JPuLi9mJi/uLi9mJi/uLt/k7vJNZiYv7i6fNDP5pJnJi7vL32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOInX+bu8mJm8kkzk0+amby4u3yTmcmLu8uLu8s3ubu8mJm8uLu8mJm8uLs02wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPslX2Rm8kl3l2Yzkxd3lxczk2Z3l0+amXyTu8uLmcmLu8s32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+MmXubu8mJm8mJl80t3lxcyk2d2l2czkxd3lxczkxd3lxczkxd3lxczkxd3lkzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeZ+Cf9ZM5MXd5cXM5MXd5cXM5MXd5cXM5MXd5dmM5MXd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdLPmhmwp9zd+H3Zibf5O7Cn7MBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTL3N3+ZvMTL7JzORvcnfh92YmL+4un7QBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPGTcjOTb3J3+SYzk2Z3l28yM3lxd3kxM/mku8uLu8s32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+AnwNe4uL2Ymf5MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQImfwP+5u3zSzOTFzOTF3eXFzOTF3eXFzOTF3YXf2wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+Em5uwu/d3d5MTN5cXf5pLvLi5nJi7vLi5lJs5nJi7vLN9kAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjJl5mZ0GNm8kkzk0+amby4u7yYmXyTu0uzDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJuV8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOJ/uW0BYa6k0YwAAAAASUVORK5CYII=	\N	\N	ACTIVO	1
138	142	Finca El Porvenir	LA PRIMAVERA	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWKSURBVO3BQY4kBw4EsJBQ//+ydo6++JBA57pimuTcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZib8nLvLm2Ymze4uT8xM+Dl3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88mXuLr/JzORNM5Mn7i5vmpk0u7v8JjOTb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJuZnJN7m7NJuZfJO7S7OZyTe5uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4BP7h7vLEzAT+XzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6Bf5iZvOnu8sTM5Im7C3+vDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT8rdXfg5d5cnZiZPzEyeuLs0u7vwczYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MjMT/l53lydmJk/cXd40M+G/swEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdHAApsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Um5m8sTd5U0zk2Z3lydmJm+6uzwxM3ni7vLEzOQ3ubt8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++zMzkTTOTJ+4ub7q7/CZ3lydmJk/cXb7J3eVNM5M3zUyeuLu8aQNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6PFJuZvOnu8qaZyZvuLk/MTN50d2k2M3nT3YV/twEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZiZP3F1+k7sL/25m0uzu8qaZyRN3lydmJk/cXd60ASixASixASixASixASixASixASixASixASixASixASgx90e+yMyk2d3liZkJ/527yxMzkzfdXb7JzOSJu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v4If62ZyZvuLk/MTJ64u7xpZvLE3YX/zgagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5nwc+4uze4uT8xM3nR3+U1mJk/cXb7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ1/m7vKbzEy+yd3liZnJm+4ub5qZPHF3eWJm8sTd5YmZyRN3lydmJk/cXd60ASixASixASixASixASixASixASixASixASixASixASjxSbmZyTe5u3yTu8s3ubs8MTNpdnf5JjOTZhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/AP8xMnri7vOnu8qaZSbO7y2+yASixASixASixASixASixASixASixASixASixASixASjxCX+1mcmbZiZP3F2emJk8cXd54u7yxMzkTXeXN81M3nR3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn5e4u/Lu7yxMzkyfuLk/MTJ64uzwxM3nT3eWbzEzedHf5JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEnN/5EUzE37O3aXZzORNd5cnZib8nLvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJeb+CECBDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJ/wHBwQVNpetuKgAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
139	143	Finca La Tagua	LA PRIMAVERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
140	144	Finca La Esmeralda	LA PRADERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
141	145	Finca El Recreo	EL DIAMANTE	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
142	146	Finca La Macarena	SAN LUIS	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWSSURBVO3BQY4kBw4EsJBQ//+ydi4G9uJDAp1wxTTJuT8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTl81M+Dl3l28yM3ni7vJNZib8nLvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MneX32Rm8k1mJk/cXZ6Ymbzp7vKmu8tvMjP5JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp+Um5l8k7tLs7vLEzOTN91dms1MvsndpdkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn8MVmJk/cXfh7bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfMJfbWbyTe4uT8xM4B8bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflLu78O/uLm+ambzp7tLs7sLP2QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTLzEz4OTOTJ+4u32Rm8sTd5U0zE/47G4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn7zs7sLf6+7yxMzkibvLm+4u9NgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3MzkTXeXN81M+DkzkzfdXZ6YmTxxd+HfbQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKzP2RF81M3nR3eWJm8k3uLk/MTJ64uzwxM3ni7vKbzEyeuLu8aWbyxN3liZnJE3eXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZe4uv8nM5DeZmTxxd3liZvLE3eVNM5NvMjNptgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXmZk0u7vw37m7PDEzeeLu8k1mJm+6u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT152d3liZvKmu8s3mZk8cXd5YmbyppnJE3eX32Rm8sTd5U13l2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzf4S/1szkibtLs5nJN7m78HM2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednMhJ9zd3nTzOSJu8sTM5Nmd5cnZiZP3F3eNDN54u7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MneX32Rm8qa7yxMzkzfdXZ6YmTxxd3liZvKmu8ubZiZP3F2emJk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCflZibf5O7S7O7yppnJN7m70GMDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOIT/mozk29yd3nTzORNd5cnZiZP3F3eNDN54u7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT6B/3N3eWJm8sTM5Im7Cz/n7tJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3J3F/7d3eVNd5cnZiZvurs0m5k8cXd5YmbyprvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MjMT/jszkyfuLt9kZvJN7i7N7i7fZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYu6PABTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4H1EK/1A1di49AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
143	147	Finca El Mango	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
144	148	Finca El Nido	AGUA DULCE	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWPSURBVO3BMY4kiREEsMhE///LqTUk4BwZJU3hOm5Izv0RgAIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvGxmws+5u/BzZib8nLvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MneX32Rm8qaZyRN3lydmJk/cXZrdXX6Tmck32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTczOSb3F2azUy+yczkibvLN5mZfJO7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP4C/uLk/MTJ6YmTxxd4H/2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+AT+D3eXJ2YmT8xMnri78M+1ASixASixASixASixASixASixASixASixASixASixASjxSbm7Cz9nZvKmu8tvcnfh52wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZWYm/H3uLk/MTN40M3ni7vKmmQl/nw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibk/Av82M2l2d+GfawNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNyM5Mn7i5vmpk0u7u8aWbyxN3liZnJE3eXJ2Ymv8nd5ZtsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAErM/ZFfZGbyprsL/K9mJm+6uzTbAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvMTJ64uzSbmbzp7vLEzORNd5cnZiZP3F2emJk8cXdpNjN5093lTRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp98mbvLEzOTJ+4uT8xM3nR3+SZ3lzfNTH6TmQk/ZwNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pOXzUyeuLs0m5l8k7vLm2YmT9xdnpiZvOnu8qa7yzeZmTxxd/kmG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASc3+Ef6yZSbO7yxMzkyfuLk/MTJ64uzwxM3nT3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJy+bmfBz7i5vuru8aWbyTWYmb5qZfJOZyZvuLm/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvcXX6Tmck3mZnwc+4ub5qZPHF3eWJm8k02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTcz+SZ3l29yd3liZvLE3eVNM5Mn7i5PzEzeNDN5093liZlJsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU/gL+4uT8xMfpO7yzeZmTxxd2m2ASixASixASixASixASixASixASixASixASixASixASjxCf9oM5M33V2+ycyk2czkTTOTN91d3rQBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPFJubsL/93dpdnM5Im7yxMzkzfNTJ64u7xpZvLE3eWbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJlZib8fWYmT9xdnpiZfJO7y5vuLk/MTL7JzOSJu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5v4IQIENQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIl/AUhO63MJZDA1AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
145	149	Finca La Cabaña	LA PRADERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
146	150	Finca El Prado	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
147	151	Finca El Turpial	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAW0SURBVO3BQY4kiQ0EsJBQ//+yPJcFfNlDwp1wxTTJuT8CUGADUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTl81M+Dl3lzfNTJ64uzSbmfBz7i5v2gCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+OTL3F1+k5nJN7m7vGlm8qa7y5vuLr/JzOSbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFJuZvJN7i7fZGbyxN3liZnJE3eX32Rm8k3uLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+gf8yM3ni7vLEzORNdxf+XhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/wV7u7PDEz+SZ3F/jHBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ+XuLvz/zEyeuLs8MTN54u7yTe4u/JwNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPvszMhJ8zM3ni7vLEzOQ3mZnw/7MBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3RwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPLLzEzedHd5YmbyprvLEzOTN91d+HczkzfdXZptAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp88rKZSbO7yxMzkyfuLm+amfDvZiZP3F2emJk8cXf5JjOTJ+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjkZXeXN81Mms1Mnri7PHF3eWJm8qaZyRN3lzfdXeixASixASixASixASixASixASixASixASixASixASixASgx90deNDN5093lTTOTN91dnpiZPHF3+U1mJk/cXeixASixASixASixASixASixASixASixASixASixASixASjxyZe5u7xpZvLE3eWJmckTM5Mn7i7NZiZvurs8MTN54u7yppnJE3eX32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLuj/DXmpk8cXd5YmbyxN3liZlJs7vLEzOTJ+4uT8xM3nR3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnL5uZ8HPuLm+amTS7u7xpZvLEzOSJu8s3ubt8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiU++zN3lN5mZvOnu8sTM5Im7yxMzkyfuLm+amTSbmTxxd2m2ASixASixASixASixASixASixASixASixASixASixASjxSbmZyTe5u3yTmckTd5cnZiZP3F1+k7vLm+4ub5qZPHF3edMGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn8D+4uzwxM3nT3eVNd5cnZiZvuru86e7yTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT7hr3Z3edPM5E13lydmJk/cXd50d3liZvLEzOSb3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5uws/Z2byprvLEzOTJ+4uT8xMnri7PDEzeeLu8sTM5Im7yxMzk2+yASixASixASixASixASixASixASixASixASixASixASjxyZeZmcA/7i5PzEyeuLu86e7yTWYmT9xdvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMTcHwEosAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8R8ShhJbfnFo4gAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
148	152	Finca El Tulipán	EL PRADO	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAW/SURBVO3BMZIkiQ0EsCSj//9lap0zzyjFltQ5A2DujwAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ORlMxP+nrvLEzOTN91dms1M+HvuLm/aAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45MvcXX6Tmcmb7i7NZiZP3F3edHf5TWYm32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcjOTb3J3+U1mJk/cXX6Tmck3ubs02wCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+IQfbWbyxN3libvLEzOTJ+4u8I8NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP+NHuLm+amTxxd4H/1gagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCfl7i7wre4u/D0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffJmZCX/PzOSJu8s3mZk8cXd508yE/58NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5PwL/IzOTJ+4u8I8NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPys1Mnri7PDEz+SZ3lydmJm+6uzxxd3nTzOSJu8s3mZk8cXd508zkibvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT552czkibvLE3eXJ2Ymb7q7NLu7PDEzeeLu8qa7y5tmJk/cXd40M3ni7tJsA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fdXZ6YmTSbmbzp7tJsZvLE3eWJmckTd5dvcnd5Ymbym2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u7yppnJE3eX3+Tu8sTM5E13l28yM/kmM5Mn7i7fZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pOXzUzeNDN54u7yTWYmzWYmb5qZPHF3eWJm8qa7yxMzE/7dBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDE3B/hx5qZPHF3+SYzk29yd/lNZiZP3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnLZib8PXeXJ+4ub5qZPHF3eeLu8sTM5Im7y5tmJk/cXZ6YmTxxd2m2ASixASixASixASixASixASixASixASixASixASixASjxyZe5u/wmM5M3zUy+yczkTXeXb3J3+SYzk2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflJuZfJO7S7O7y5tmJm+ambzp7vLEzOSJu8sTd5c3zUy+yQagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCf8aHeXN81M3nR3+SYzkyfuLk/MTJ64uzwxM3ni7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPuFHm5k8cXd54u7yppnJb3J3eWJm8sTd5YmZyRN3lzdtAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Uu7uwr+7u7xpZvLE3eWJu8sTM5NvMjN5093lTXeXb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl5mZ8HPNTJ64uzxxd3liZvKmu8ubZiZP3F2emJk8cXd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwfASiwASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASixASjxH458F1yuk6I6AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
149	153	Finca El Refugio	LA SOLEDAD	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAV6SURBVO3BMZIcBw4EwAJi/v9lHA0ZcmS0Yvs0RWbm3C8BKLABKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJy2Ym/Jy7S7OZyZvuLk/MTPg5d5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJl7i5/kpkJPe4uf5KZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzM5JvcXb7JzKTZ3aXZzOSb3F2abQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfAL/R3cX+Lc2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+4bd2d3nTzORNM5Mn7i78vjYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pd3fh58xMnri78M/uLvycDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77MzISfMzN54u7yxMzkibtLs5kJ/50NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5XwJ/mZk8cXd5YmbyprsLv68NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP/jAzkzfdXZ6Ymbzp7kKPmcmb7i7NNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5n7JF5mZfJO7yzeZmfBz7i5vmpm86e7yppnJE3eXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyspnJm+4uT8xM3jQz+SZ3lzfNTJ64u7xpZvLEzOSJu8s3mZk8cXdptgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8ckf5u7yxMzkibvLm2Ym9Li7fJOZSbMNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPys1M3nR3eWJm8qa7y5tmJk/cXZ6Ymbzp7vLEzKTZzORNd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEoMfdL+G3NTN50d2k2M3nT3eVNM5Nvcnd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5nwc+4ub7q7fJOZyRN3lyfuLk/MTJ6YmTS7u3yTDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT77M3eVPMjN5093liZkJ/527yxMzkyfuLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+KTcz+SZ3l28yM2l2d3liZvLE3eVNd5cnZibfZGbyxN3lTRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/A39xd3jQzedPd5YmZyRN3lydmJm+6u7zp7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPuG3dnd5YmbyprvLEzOTZneXJ2YmT8xMvsnd5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflLu78HPuLk/MTPhnM5Mn7i5PzEyeuLs8MTP5JhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp98mZkJPe4uT8xMvsnd5U13l28yM3ni7vJNNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAl5n4JQIENQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIn/AWRg7lvWM0CkAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
150	154	Finca La Cosecha	LA PRIMAVERA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
151	155	Finca La Serena	EL DIAMANTE	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
152	156	Finca Villa Hermosa	LA SOLEDAD	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
153	157	Finca El Diamante Verde	EL PORVENIR	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
154	158	Finca El Chiparo	Belén	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWeSURBVO3BQY4kiQ0EsJBQ//+yPAcb8MWHhDuxFdMk5/4IQIENQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPXjYz4efcXd40M3ni7vLEzORNd5cnZib8nLvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT75MneX32Rm8k3uLm+6uzwxM/kmd5ffZGbyTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzP5JneXbzIzeeLu8sTMhP9tZvJN7i7NNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPoH/w93liZnJE3cX+I8NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlP+KvdXeBvsQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5uws97i6/yd2Fn7MBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl5mZ8HNmJk/cXZ6YmTxxd3liZvLE3eVNMxP+ORuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEnN/BP5tZvJN7i7wHxuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp/8MjOTN91dnpiZvOnu0mxm8sTdpdnM5E13l2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzf+SLzEzedHd5YmbyprvLEzMT/jl3lydmJm+6u7xpZvLE3eVNG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn/Cj7i5PzEzedHd5YmbS7O7S7O7yxMzkibtLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibk/wo+ZmTxxd2k2M/kmd5cnZiZP3F3eNDNpdnd50wagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5k8cXd5YmbyTe4uT8xMmt1dnpiZPHF3eWJm0uzu8qaZyRN3l2+yASixASixASixASixASixASixASixASixASixASixASgx90f4a81M3nR3edPM5E13lydmJk/cXZ6YmTxxd3liZvKmu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZzISfc3f5Te4ub5qZvGlm8sTd5ZvcXb7JBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ1/m7vKbzEzedHf5JjOTJ+4uv8nM5E13l2YbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKflJuZfJO7yzeZmbzp7vLE3eWJmcmb7i5PzEyeuLs8MTP5JjOTJ+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPgE/svd5ZvcXZ6Ymbzp7vLEzKTZ3eWbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfMJf7e7yxMzkm9xd3jQzeeLu8sTd5YmZyZtmJm+6u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik3J3F37O3eWbzEyeuLs8MTN508zkibvLEzOTJ+4uT8xMvskGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnX2ZmQo+ZSbO7y5vuLt9kZvLE3eWbbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKzP0RgAIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBL/An03DU4VkQHVAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
155	159	Finca San Isidro	SAN ANTONIO	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWlSURBVO3BMY4cgQ0EwCax//8yrcSAEwUDaKxtXVXN/RKAAhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp+8bGbCn3N3eWJm8sTd5U0zkzfdXZ6YmfDn3F3etAEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXubv8JDOTbzIzeeLu8qa7yze5u/wkM5NvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5mck3ubt8k7vLm2YmT9xdnpiZPHF3+SYzk29yd2m2ASixASixASixASixASixASixASixASixASixASixASjxCf+0mcmb7i5vurvAf20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnwC/+Pu8sTM5JvcXfh3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFLu7sKfMzN54u7C791d+HM2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU++TIzE/6eu8sTM5Mn7i5PzEyeuLu8aWbC37MBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3S+D/ZGbyxN0F/msDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTH2Zm8sTd5U0zkyfuLvw9M5Nvcnd5YmbyprvLmzYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT552czkm9xd3jQzeeLu8sTM5Im7S7OZyRN3l29yd3nTzORNd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cnL7i5PzEzeNDN5093liZnJN5mZvOnu8qaZyRN3lzfNTJ64u3yTmckTd5c3bQBKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPKymckTd5cnZiZP3F2emJk8MTN54u7yppkJvzcz+UnuLs02ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU+ednd5U13lydmJk/cXd40M3nT3YW/5+7yxMyE39sAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlJj7JfyzZiZvurs8MTN54u7yppnJE3eXJ2YmT9xd+L0NQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIm5X/KimQl/zt3lTTOTZneXbzIzeeLu8sTM5Im7S7MNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIkNQIlPvszd5SeZmfB7d5c3zUyeuLs8cXd5093liZnJm+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3Mzkm9xd+L27yze5uzSbmfwkG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn/BPm5m86e7yxMzkTXeXJ2Ymb7q7vOnu8sTMpNkGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQn/NPuLk/MTH6Su8sTM5NvMjN54u7yxMzkm2wASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnxS7u7Cn3N3eWJm8sTd5U0zkyfuLt9kZvLE3eWJmckTd5dvsgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8cmXmZnw98xMmt1dnpiZNJuZPHF3abYBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKDH3SwAKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABK/AeXkwlbxizFOAAAAABJRU5ErkJggg==	\N	\N	ACTIVO	1
156	160	Finca La Fontana	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
157	161	Finca El Aguila	LAS MINAS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
158	162	Finca La Primavera	R. La Esperanza	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWnSURBVO3BMY4cgZEEwKzC/P/LdXQEyFmjITZukhsRc38EoMAGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQGoMQnL5uZ8PfcXd40M3ni7vKmmckTd5cnZib8PXeXN20ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASnzyZe4uv8nM5DeZmTxxd/kmd5ffZGbyTTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzP5JncXfnZ3eWJm8sTd5ZvMTL7J3aXZBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEBqDEJ/A/mJk8cXd54u4C/7EBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPEJ/7SZyZvuLm+amTxxd+HftQEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Um5uws/u7u8aWbCz+4u/D0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffJmZCX/PzOSJu8ub7i5PzEy+ycyE/z8bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKfvOzuQo+ZyRN3l2Z3F3psAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEpsAEp8Um5m8qa7y5tmJvzs7vLEzORNd5cnZiZP3F342QagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxNwf4UczkyfuLt9kZvLE3eWJmckTd5dvMjN5093liZnJE3eXJ2Ymb7q7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTLzMzedPd5U0zkzfdXd40M3nTzORNd5cn7i5PzEyemJk0u7t8kw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibk/Umxm8k3uLr/JzOSb3F2azUyeuLs8MTN5093lTRuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEhuAEp+8bGbCz2Ymb7q7vOnu8sTM5JvMTJ64uzwxM3ni7vJN7i7fZANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pOX3V342d3lTTOTb3J3eWJm8k1mJk/cXZ6Ymbzp7vLEzOSJu8ubNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPnnZzIS/5+7yTe4uT8xMvsnd5U0zk2Z3l2+yASixASixASixASixASixASixASixASixASixASixASjxyZe5u/wmM5M33V2emJm86e7yxMyk2d3liZnJE3eXN81Mnri7vGkDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUOKTcjOTb3J3+U1mJs1mJk/cXb7JzOSJu0uzDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT/inzUyeuLs8MTP5JjOTbzIzedPd5YmZyRN3l2+yASixASixASixASixASixASixASixASixASixASixASjxCfyXmcmb7i5vmpk0u7u86e7SbANQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQYgNQ4pNydxd+dnd5YmbS7O7SbGbyxN3liZnJm+4ub9oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPjky8xM+HfNTJ64uzwxM3ni7vLEzOSJu0uzu8s32QCU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACUmPsjAAU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACU2ACX+D8+RBWjVsMI1AAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
159	163	Finca El Néctar	LA PRIMAVERA	\N	data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAklEQVR4AewaftIAAAWMSURBVO3BQY4khw0EwCTR//8yvRcfBbjkKahTExFzfwSgwAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxAagxCcvm5nwc+4uT8xM3nR3aTYz4efcXd60ASixASixASixASixASixASixASixASixASixASixASjxyZe5u/wmM5Nvcnd5YmbyxN3liZnJE3eXN91dfpOZyTfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4pNzM5JvcXZrNTPg5M5NvcndptgEosQEosQEosQEosQEosQEosQEosQEosQEosQEosQEo8Qn/aneXJ2Ymb5qZwN+1ASixASixASixASixASixASixASixASixASixASixASjxCfwf7i5PzEzg79oAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPik3N2FvzYzeeLu8sTM5Im7y29yd+HnbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfPJlZibwXzOTJ+4ub5qZ8M/ZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT45GV3F3rMTJ64uzwxM/kmdxd6bABKbABKbABKbABKbABKbABKbABKbABKbABKbABKbABKfFJuZvJN7i5PzEyeuLv8JneXJ2Ym3+Tu8qaZyTe5u7xpA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1Dik5fNTJ64uzSbmTxxd3liZvLE3eVNM5Mn7i5vuru8aWbyppnJE3eX32QDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGIDUGLujxSbmTxxd3liZtLs7vLEzOSJu8s3mZk8cXd508zkm9xdmm0ASmwASmwASmwASmwASmwASmwASmwASmwASmwASmwASsz9kRfNTH6Tu8ubZiZvurs8MTN5093lTTMTfs7d5U0bgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBKffJm7y5tmJk/cXd40M/kmM5Mn7i5PzEyemJl8k7vLEzOTJ+4uT8xMnri7PDEz+SYbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBIbgBJzf4R/rZnJm+4ub5qZfJO7yzeZmTxxd2m2ASixASixASixASixASixASixASixASixASixASixASgx90deNDPh59xd3jQzeeLu8sTM5E13lydmJm+6u/BzNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlNgAlPvkyd5ffZGbyTe4uT8xMnri7PDEzedPdhb82M3ni7vKmDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJDUCJT8rNTL7J3eWbzEyeuLs8cXd5YmbyxN3liZnJN7m7PDEzedPd5Ym7yzfZAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4BL7YzOQ3ubs8MTP5TTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJTYAJT4B/md3lydmJk/cXfhrG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASG4ASn5S7u/DX7i78nJlJs5nJE3eXb7IBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKLEBKPHJl5mZ8M+ZmXyTu8sTM5Mn7i5vmpl8k7tLsw1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1AiQ1Aibk/AlBgA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1BiA1DiP024+FdhsnbLAAAAAElFTkSuQmCC	\N	\N	ACTIVO	1
160	164	Finca El Pozo	SAN LUIS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
161	165	Finca La Felicidad	R. LA ESPERANZA	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
162	166	Finca La Palma	EL PRADO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
163	167	Finca La Cachama	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
164	168	Finca El Manantial	SAN LUIS	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
165	169	Finca El Encanto	Sarabando	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
166	170	Finca La Campiña	LOS ANGELES	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
167	171	Finca El Bosque	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
168	172	Finca El Cedral	SAN ANTONIO	\N	data:image/png;base64,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	\N	\N	ACTIVO	1
\.


--
-- TOC entry 5275 (class 0 OID 24865)
-- Dependencies: 234
-- Data for Name: proyeccion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyeccion (id_proyeccion, id_produccion, cantidad_proyectada, fecha_proyeccion, metodo_calculo) FROM stdin;
\.


--
-- TOC entry 5297 (class 0 OID 25044)
-- Dependencies: 256
-- Data for Name: ranking_productor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ranking_productor (id_ranking, id_productor, posicion, puntuacion, criterio, periodo) FROM stdin;
\.


--
-- TOC entry 5295 (class 0 OID 25029)
-- Dependencies: 254
-- Data for Name: reporte; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reporte (id_reporte, id_administrador, tipo_reporte, fecha_generacion, parametros, archivo_url) FROM stdin;
\.


--
-- TOC entry 5307 (class 0 OID 33292)
-- Dependencies: 266
-- Data for Name: ruta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ruta (id_ruta, fecha, estado, flete, total_kilos, precio_base_kg_snapshot, precio_final_kg, id_producto, created_at, id_operario) FROM stdin;
1	2026-03-22	CERRADA	200000.00	188.00	2000.00	866.17	\N	2026-03-22 14:50:10.341995	\N
2	2026-03-22	CERRADA	600000.00	587.50	1500.00	426.22	\N	2026-03-22 15:46:51.238191	\N
3	2026-03-26	CERRADA	600000.00	972.00	2000.00	1334.32	\N	2026-03-26 13:57:31.284726	\N
4	2026-03-28	CERRADA	100000.00	944.00	3200.00	2985.78	\N	2026-03-27 22:45:02.459817	2
5	2026-04-07	CERRADA	1000.00	788.00	2000.00	1928.78	\N	2026-04-07 16:08:46.142144	2
6	2026-04-10	CERRADA	100000.00	1084.00	2100.00	1937.48	\N	2026-04-10 09:20:18.888707	2
7	2026-04-10	CERRADA	600000.00	1854.00	2100.00	1714.20	\N	2026-04-10 16:46:56.211055	2
8	2026-04-17	CERRADA	600000.00	1558.95	1800.00	1365.60	\N	2026-04-17 14:50:01.650542	2
9	2026-04-24	CERRADA	20000.00	323.00	1800.00	1677.25	\N	2026-04-24 11:59:39.300359	2
10	2026-04-24	CERRADA	800000.00	5176.97	2100.00	1877.38	\N	2026-04-24 11:59:44.702587	2
11	2026-04-26	CERRADA	200000.00	1125.00	2100.00	1854.94	\N	2026-04-26 18:28:31.444871	2
12	2026-04-27	CERRADA	900000.00	6195.99	2100.00	1886.33	\N	2026-04-27 15:31:37.681617	2
13	2026-04-27	CERRADA	800000.00	6941.00	2100.00	1915.28	\N	2026-04-27 18:28:46.034542	2
14	2026-04-27	ABIERTA	\N	\N	\N	\N	\N	2026-04-27 21:48:45.269133	2
\.


--
-- TOC entry 5291 (class 0 OID 24998)
-- Dependencies: 250
-- Data for Name: ruta_planificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ruta_planificacion (id_ruta, id_productor, origen, destino, fecha_planificada, estado, distancia_km, fecha_creacion) FROM stdin;
\.


--
-- TOC entry 5259 (class 0 OID 24738)
-- Dependencies: 218
-- Data for Name: sesion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sesion (id_sesion, id_usuario, fecha_inicio, fecha_fin, token) FROM stdin;
\.


--
-- TOC entry 5309 (class 0 OID 33331)
-- Dependencies: 268
-- Data for Name: stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock (id_stock, id_producto, kilos_disponibles, kilos_acumulados, ultima_actualizacion) FROM stdin;
2	4	689.00	1066.99	2026-04-27 16:50:24.51409
1	3	4785.09	20935.96	2026-04-27 21:58:38.430418
3	2	4372.97	5911.46	2026-04-27 21:58:38.456086
\.


--
-- TOC entry 5311 (class 0 OID 33348)
-- Dependencies: 270
-- Data for Name: stock_movimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movimiento (id_movimiento, id_producto, tipo, kilos, referencia_id, referencia_tipo, descripcion, fecha) FROM stdin;
1	2	ENTRADA	64.50	2	RUTA	Backfill: Ruta #2	2026-03-22 15:46:51.238191
2	3	ENTRADA	188.00	1	RUTA	Backfill: Ruta #1	2026-03-22 14:50:10.341995
3	3	ENTRADA	502.00	2	RUTA	Backfill: Ruta #2	2026-03-22 15:46:51.238191
4	4	ENTRADA	21.00	2	RUTA	Backfill: Ruta #2	2026-03-22 15:46:51.238191
5	4	SALIDA	5.00	2	VENTA	Backfill: Venta #2	2026-03-11 00:00:00
6	3	SALIDA	10.00	2	VENTA	Backfill: Venta #2	2026-03-11 00:00:00
7	3	SALIDA	23.00	74	VENTA	Backfill: Venta #74	2026-03-22 00:00:00
8	3	SALIDA	23.00	75	VENTA	Backfill: Venta #75	2026-03-22 00:00:00
9	3	SALIDA	54.00	76	VENTA	Backfill: Venta #76	2026-03-22 00:00:00
10	3	SALIDA	800.00	77	VENTA	Backfill: Venta #77	2026-03-22 00:00:00
11	2	ENTRADA	64.50	2	RUTA	Backfill: Ruta #2	2026-03-22 15:46:51.238191
12	3	ENTRADA	188.00	1	RUTA	Backfill: Ruta #1	2026-03-22 14:50:10.341995
13	3	ENTRADA	502.00	2	RUTA	Backfill: Ruta #2	2026-03-22 15:46:51.238191
14	4	ENTRADA	21.00	2	RUTA	Backfill: Ruta #2	2026-03-22 15:46:51.238191
15	4	SALIDA	5.00	2	VENTA	Backfill: Venta #2	2026-03-11 00:00:00
16	3	SALIDA	10.00	2	VENTA	Backfill: Venta #2	2026-03-11 00:00:00
17	3	SALIDA	23.00	74	VENTA	Backfill: Venta #74	2026-03-22 00:00:00
18	3	SALIDA	23.00	75	VENTA	Backfill: Venta #75	2026-03-22 00:00:00
19	3	SALIDA	54.00	76	VENTA	Backfill: Venta #76	2026-03-22 00:00:00
20	3	SALIDA	800.00	77	VENTA	Backfill: Venta #77	2026-03-22 00:00:00
21	3	ENTRADA	772.00	3	RUTA	Cierre Ruta #3 — 772.00 kg	2026-03-27 19:50:04.5975
22	2	ENTRADA	200.00	3	RUTA	Cierre Ruta #3 — 200.00 kg	2026-03-27 19:50:04.612045
23	4	ENTRADA	46.00	4	RUTA	Cierre Ruta #4 — 46.00 kg	2026-03-31 14:27:56.275676
24	3	ENTRADA	898.00	4	RUTA	Cierre Ruta #4 — 898.00 kg	2026-03-31 14:27:56.302197
25	3	SALIDA	1200.00	83	VENTA	Venta #83 — 1200 kg	2026-03-31 16:58:27.895429
26	2	SALIDA	100.00	84	VENTA	Venta #84 — 100 kg	2026-03-31 17:00:13.773113
27	2	SALIDA	64.00	85	VENTA	Venta #85 — 64 kg	2026-03-31 19:09:06.598813
28	4	SALIDA	50.00	86	VENTA	Venta #86 — 50 kg	2026-03-31 19:29:39.057482
29	3	SALIDA	23.00	87	VENTA	Venta #87 — 23 kg	2026-03-31 19:39:46.500825
30	3	ENTRADA	233.00	5	RUTA	Cierre Ruta #5 — 233.00 kg	2026-04-07 16:10:47.934533
31	4	ENTRADA	210.00	5	RUTA	Cierre Ruta #5 — 210.00 kg	2026-04-07 16:10:47.95749
32	2	ENTRADA	345.00	5	RUTA	Cierre Ruta #5 — 345.00 kg	2026-04-07 16:10:47.973177
33	4	SALIDA	22.00	95	VENTA	Venta #95 — 22 kg	2026-04-10 12:12:57.586229
34	3	SALIDA	234.00	96	VENTA	Venta #96 — 234 kg	2026-04-10 12:32:42.465286
35	2	SALIDA	123.00	97	VENTA	Venta #97 — 123 kg	2026-04-10 12:32:42.515703
36	2	SALIDA	145.00	98	VENTA	Venta #98 — 145 kg	2026-04-10 12:36:24.765655
37	3	SALIDA	100.00	99	VENTA	Venta #99 — 100 kg	2026-04-10 13:02:25.734705
38	3	ENTRADA	1084.00	6	RUTA	Cierre Ruta #6 — 1084.00 kg	2026-04-10 13:03:09.847008
39	4	SALIDA	12.00	100	VENTA	Venta #100 — 12 kg	2026-04-10 13:16:10.077716
40	3	SALIDA	234.00	101	VENTA	Venta #101 — 234 kg	2026-04-10 13:22:43.332146
41	3	SALIDA	122.00	102	VENTA	Venta #102 — 122 kg	2026-04-10 13:28:40.161952
42	4	SALIDA	12.00	103	VENTA	Venta #103 — 12 kg	2026-04-10 13:39:10.862187
43	3	SALIDA	12.00	104	VENTA	Venta #104 — 12 kg	2026-04-10 13:49:39.757721
44	3	SALIDA	234.00	105	VENTA	Venta #105 — 234 kg	2026-04-10 16:50:46.195823
45	3	SALIDA	21.00	106	VENTA	Venta #106 — 21 kg	2026-04-10 17:10:53.335741
46	4	SALIDA	54.00	107	VENTA	Venta #107 — 54 kg	2026-04-10 21:03:49.044261
47	3	SALIDA	234.00	108	VENTA	Venta #108 — 234 kg	2026-04-10 21:16:20.816041
48	2	SALIDA	7.50	109	VENTA	Venta #109 — 7.5 kg	2026-04-10 21:25:34.603256
49	4	SALIDA	100.00	110	VENTA	Venta #110 — 100 kg	2026-04-10 21:37:46.82496
50	3	SALIDA	10.00	111	VENTA	Venta #111 — 10 kg	2026-04-11 12:46:28.975007
51	3	ENTRADA	1854.00	7	RUTA	Cierre Ruta #7 — 1854.00 kg	2026-04-12 19:55:38.716566
52	3	SALIDA	1200.00	112	VENTA	Venta #112 — 1200 kg	2026-04-12 19:56:36.877286
53	3	SALIDA	12.00	113	VENTA	Venta #113 — 12 kg	2026-04-14 09:41:31.201472
54	3	SALIDA	123.00	114	VENTA	Venta #114 — 123 kg	2026-04-14 09:42:13.141101
55	3	SALIDA	123.00	115	VENTA	Venta #115 — 123 kg	2026-04-15 14:39:55.685733
56	3	SALIDA	200.00	116	VENTA	Venta #116 — 200 kg	2026-04-15 14:53:37.762862
57	3	SALIDA	12.00	117	VENTA	Venta #117 — 12 kg	2026-04-15 15:05:11.966664
58	3	SALIDA	201.00	118	VENTA	Venta #118 — 201 kg	2026-04-15 15:18:34.206287
59	3	SALIDA	123.00	119	VENTA	Venta #119 — 123 kg	2026-04-15 19:51:19.246752
60	2	SALIDA	100.00	120	VENTA	Venta #120 — 100 kg	2026-04-16 17:10:17.789845
61	3	SALIDA	222.00	121	VENTA	Venta #121 — 222 kg	2026-04-17 14:20:42.727901
62	2	ENTRADA	429.97	8	RUTA	Cierre Ruta #8 — 429.97 kg	2026-04-17 15:14:35.096345
63	3	ENTRADA	694.98	8	RUTA	Cierre Ruta #8 — 694.98 kg	2026-04-17 15:14:35.125342
64	4	ENTRADA	434.00	8	RUTA	Cierre Ruta #8 — 434.00 kg	2026-04-17 15:14:35.139626
65	2	SALIDA	24.00	122	VENTA	Venta #122 — 24 kg	2026-04-22 20:43:30.814938
66	2	ENTRADA	123.00	9	RUTA	Cierre Ruta #9 — 123.00 kg	2026-04-24 12:02:26.23108
67	3	ENTRADA	200.00	9	RUTA	Cierre Ruta #9 — 200.00 kg	2026-04-24 12:02:26.254228
68	3	SALIDA	21.00	123	VENTA	Venta #123 — 21 kg	2026-04-24 12:03:24.302642
69	2	SALIDA	22.00	124	VENTA	Venta #124 — 22 kg	2026-04-24 12:03:25.16583
70	3	SALIDA	322.87	125	VENTA	Venta #125 — 322.87 kg	2026-04-24 15:25:50.990247
71	3	SALIDA	23.00	126	VENTA	Venta #126 — 23 kg	2026-04-24 16:30:49.477478
72	3	SALIDA	234.00	127	VENTA	Venta #127 — 234 kg	2026-04-24 16:31:33.23837
73	2	SALIDA	452.99	127	VENTA	Venta #127 — 452.99 kg	2026-04-24 16:31:33.246579
74	4	SALIDA	122.99	127	VENTA	Venta #127 — 122.99 kg	2026-04-24 16:31:33.254168
75	3	ENTRADA	3806.98	10	RUTA	Cierre Ruta #10 — 3806.98 kg	2026-04-26 18:22:17.598496
76	2	ENTRADA	1369.99	10	RUTA	Cierre Ruta #10 — 1369.99 kg	2026-04-26 18:22:17.621346
77	3	ENTRADA	593.00	11	RUTA	Cierre Ruta #11 — 593.00 kg	2026-04-27 15:29:08.680063
78	2	ENTRADA	211.00	11	RUTA	Cierre Ruta #11 — 211.00 kg	2026-04-27 15:29:08.704589
79	4	ENTRADA	321.00	11	RUTA	Cierre Ruta #11 — 321.00 kg	2026-04-27 15:29:08.711966
80	3	ENTRADA	4111.00	12	RUTA	Cierre Ruta #12 — 4111.00 kg	2026-04-27 16:50:24.497283
81	2	ENTRADA	2050.00	12	RUTA	Cierre Ruta #12 — 2050.00 kg	2026-04-27 16:50:24.508162
82	4	ENTRADA	34.99	12	RUTA	Cierre Ruta #12 — 34.99 kg	2026-04-27 16:50:24.51409
83	3	ENTRADA	5823.00	13	RUTA	Cierre Ruta #13 — 5823.00 kg	2026-04-27 20:17:05.564839
84	2	ENTRADA	1118.00	13	RUTA	Cierre Ruta #13 — 1118.00 kg	2026-04-27 20:17:05.579057
85	3	SALIDA	10000.00	128	VENTA	Venta #128 — 10000 kg	2026-04-27 21:58:38.430418
86	2	SALIDA	500.00	128	VENTA	Venta #128 — 500 kg	2026-04-27 21:58:38.456086
\.


--
-- TOC entry 5277 (class 0 OID 24877)
-- Dependencies: 236
-- Data for Name: tendencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tendencia (id_tendencia, id_proyeccion, tipo_tendencia, porcentaje_variacion, grafico_url, fecha_analisis) FROM stdin;
\.


--
-- TOC entry 5257 (class 0 OID 24725)
-- Dependencies: 216
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id_usuario, nombre, apellido, email, password, telefono, tipo_usuario, fecha_registro, activo, cedula, permisos, foto_perfil, asociacion_id) FROM stdin;
51	Rosa	Castaño	rosa.castano@campo.co	$2b$10$fn2Nq/qzOzphIfY0tA/ZUeTVZ1rpi1iw1i7cvLJ7W050GiFX.Tzc.	3174567890	PRODUCTOR	2026-04-09 16:18:05.713334	t	2087654321	{"compras","productores"}	\N	1
6	Productor	Prueba	productor@gmail.com	$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36C6V8sE6QqjQ0nL0p8sC3K	3228451079	PRODUCTOR	2026-03-09 23:03:59.417033	t	1001234567	PRODUCTOR	\N	1
2	Usuario	prueba	prueba@test.com	123456	3001234567	PRODUCTOR	2026-02-24 22:21:48.047482	t	1112764680	\N	\N	1
12	Juan	Pérez	juanp@example.com	$2b$10$zYJrjS7k7vOZV9SxOq/2Oe4l.rgQW0I9yjP3iFS7OEsA5pHBCqkFi	3001112222	PRODUCTOR	2026-03-10 10:19:29.933247	t	1001001001	\N	\N	1
13	María	Gómez	mariag@example.com	$2b$10$zYJrjS7k7vOZV9SxOq/2Oe4l.rgQW0I9yjP3iFS7OEsA5pHBCqkFi	3003334444	PRODUCTOR	2026-03-10 10:19:29.933247	t	1001001002	\N	\N	1
14	Carlos	Ramírez	carlosr@example.com	$2b$10$zYJrjS7k7vOZV9SxOq/2Oe4l.rgQW0I9yjP3iFS7OEsA5pHBCqkFi	3005556666	PRODUCTOR	2026-03-10 10:19:29.933247	t	1001001003	\N	\N	1
15	Laura	Martínez	lauram@example.com	$2b$10$zYJrjS7k7vOZV9SxOq/2Oe4l.rgQW0I9yjP3iFS7OEsA5pHBCqkFi	3007778888	PRODUCTOR	2026-03-10 10:19:29.933247	t	1001001004	\N	\N	1
16	Andrés	López	andresl@example.com	$2b$10$zYJrjS7k7vOZV9SxOq/2Oe4l.rgQW0I9yjP3iFS7OEsA5pHBCqkFi	3009990000	PRODUCTOR	2026-03-10 10:19:29.933247	f	1001001005	\N	\N	1
20	Maria	ahhjs	maria@gmail.com	$2b$10$6627XbwlWPzRCN4MCkLgr.FBGFpStCwl7wzrFIiazDEYTdTAfBHIG	3201234567	PRODUCTOR	2026-03-10 14:52:53.957203	t	1000000122	\N	\N	1
22	fvbn	fgvbn	dffd@gmail.com	$2b$10$r2hFDmYsqEJmGAgMhtexBegqjjh3mwhEgu94dFWcq3rVL5cN0sENK	3214567843	PRODUCTOR	2026-03-10 15:34:24.079349	t	0987654321	\N	\N	1
23	Jhoan	Villanueva	jhoan@gmail.com	$2b$10$UOgxZzy2.hJ3CE6YDtpt1uzSWaiZPer4G2Zb10kjVjDEmuJ/nJKae	3214166044	PRODUCTOR	2026-03-14 11:22:56.340462	t	1115722345	\N	\N	1
21	Cristina	tenorio	tenorio@gmail.com	$2b$10$GSDbKkK3gxR.piHFiG9.IeVvMX.9he1i1hOVxNAao5VpajagpJ3HO	3209243228	PRODUCTOR	2026-03-10 15:31:10.148369	t	1234567890	\N	\N	1
3	Yuleiny	Lugo	luguito@gmail.com	202420	32284510179	PRODUCTOR	2026-02-25 17:13:10.339436	t	1117512328	\N	\N	1
38	Adelmo	Salcedo Bolaños	adelmo@gmail.com	$2b$10$P0iKhVTmhh8KGUDBYI4E/uRx1RDLX8GQpqRfqh1EWx4KMK61zW1/6	3214567843	PRODUCTOR	2026-03-29 18:33:10.081483	t	1117486526	\N	\N	1
4	Admin	Sistema	admin@admin.com	$2b$10$GVz5.Sbt8HHictbF/8k0S.eWj8DMchPFtmLzwue05AjOKOzJS6KMu	3138002280	ADMIN	2026-03-09 21:33:38.417988	t	123456789	ALL	/uploads/fotos/foto_4_1774841422636.jpg	1
39	Lucía	Herrera	lucia.herrera@agrotrace.co	$2b$10$l51emks2yrCDCwkGheDG7.ZyCAJNHpA/Nu.xMdbvgwiGvjY9B7QSi	3152345678	OPERARIO	2026-04-09 15:37:21.652798	t	1019876543	{"dashboard","ventas"}	\N	1
40	Andrés	Castillo	andres.castillo@agrotrace.co	$2b$10$0J0V4MDmrUj7Be8vkSWZHeATnEjjBP4hd1g8nViCfACg1sAOpPDie	3183456789	PRODUCTOR	2026-04-09 15:37:21.737667	t	1098765432	{"compras","productores"}	\N	1
41	Valentina	Ríos	valentina.rios@agrotrace.co	$2b$10$m3uUQzme.KczfSTRazsG3erRurx.TL4aNQypPW.4p1Q407c3TRUam	3204567890	OPERARIO	2026-04-09 15:37:21.811295	t	1087654321	{"dashboard","ventas"}	\N	1
42	Daniela	Morales	daniela.morales@agrotrace.co	$2b$10$enItnVjVH9wFTKw4Oe8XFuo65GNaPlx0KDent8.f2TzF8foEkjeDG	3226789012	PRODUCTOR	2026-04-09 15:37:21.953015	t	1065432109	{"compras","productores"}	\N	1
43	Felipe	Gutiérrez	felipe.gutierrez@agrotrace.co	$2b$10$AJDECZQeJMk6hBlLeQHM3ekJ6M0q8X5sF2LoOw7i9NxhvY8wDfDP.	3137890123	OPERARIO	2026-04-09 15:37:22.023889	t	1054321098	{"dashboard","ventas"}	\N	1
44	Natalia	Ospina	natalia.ospina@agrotrace.co	$2b$10$a0.ZmZSF9wDaLFZWXbJmCOC/C0o9uqdXk9dG5HSjRcqi85gyfn79q	3168901234	PRODUCTOR	2026-04-09 15:37:22.095451	t	1043210987	{"compras","productores"}	\N	1
45	Sebastián	Vargas	sebastian.vargas@agrotrace.co	$2b$10$yNKL7fKgBweE0R/PdmOMlee52bgdTZfs7ZdPDQqYZ035d4aJaPOLG	3199012345	OPERARIO	2026-04-09 15:37:22.165766	t	1032109876	{"dashboard","ventas"}	\N	1
47	Pedro	Suárez	pedro.suarez@agrotrace.co	$2b$10$ohiuQHzEURaUD6aR.Q1Yxeq5crTOxlX6s7TAuii1g0tdentfhb0hS	3100000002	PRODUCTOR	2026-04-09 15:37:22.375181	t	1020345678	{"compras","productores"}	\N	1
48	Hernando	Cárdenas	hernando.cardenas@campo.co	$2b$10$lYPF7ju5PKD3dfOaLXX6S.3StRSKz0T8hlDBm5G18rdEgt1Xf6jY2	3121234567	PRODUCTOR	2026-04-09 16:18:05.305959	t	2010345678	{"compras","productores"}	\N	1
49	Gloria	Patiño	gloria.patino@campo.co	$2b$10$.9DBhyG3CM3XM6uKfVGj3.8Sl//tEH//lKzP6fttjB05XhGzuQWtO	3142345678	PRODUCTOR	2026-04-09 16:18:05.496827	t	2019876543	{"compras","productores"}	\N	1
50	Álvaro	Bermúdez	alvaro.bermudez@campo.co	$2b$10$ypelOsPnR26dprRF9Xq38..HwW8IObF15c58oZ58JyUrpFoULNKvK	3163456789	PRODUCTOR	2026-04-09 16:18:05.613016	t	2098765432	{"compras","productores"}	\N	1
52	Gilberto	Zapata	gilberto.zapata@campo.co	$2b$10$6zb1nNHm1KdT1xzOmJWMb.9OU/G8s2GC3prwIa3P8Wy4zYup9eUpK	3105678901	PRODUCTOR	2026-04-09 16:18:05.811209	t	2076543210	{"compras","productores"}	\N	1
53	Esperanza	Muñoz	esperanza.munoz@campo.co	$2b$10$5HgzhNjd1z/7fdjQYRxq2OjrIB5iaL2V0RcL6vn.gtBQKW4V8yDA2	3226789012	PRODUCTOR	2026-04-09 16:18:05.902954	t	2065432109	{"compras","productores"}	\N	1
54	Ernesto	Salazar	ernesto.salazar@campo.co	$2b$10$hhiwCKExSUHU3aXxmghCwuTQNu3ovVwPBcKmzznesU4s1m1kCdty6	3137890123	PRODUCTOR	2026-04-09 16:18:05.983439	t	2054321098	{"compras","productores"}	\N	1
55	Patricia	Agudelo	patricia.agudelo@campo.co	$2b$10$TUPjal8XWBZngp0QGwtEE.WnFYj0pAR1vCtg4/rmcIHKj9e0A3Yni	3168901234	PRODUCTOR	2026-04-09 16:18:06.06039	t	2043210987	{"compras","productores"}	\N	1
56	Jairo	Bedoya	jairo.bedoya@campo.co	$2b$10$DfiqoTzn1fZMP8uloGoKaukiQycKzX0rokrgjFnsUvllrNnbz4SeC	3199012345	PRODUCTOR	2026-04-09 16:18:06.141323	t	2032109876	{"compras","productores"}	\N	1
57	Carmen	Arias	carmen.arias@campo.co	$2b$10$vIw.OpysUkFO3U4LXft5ZuI1rOzP9xdbA6aFqimQcQhgRPbYDmGR2	3110123456	PRODUCTOR	2026-04-09 16:18:06.220236	t	2021098765	{"compras","productores"}	\N	1
59	Sandra	Mejía	sandra.mejia@campo.co	$2b$10$xCC8IKZSrqjtEiOBFAknf.yGb38wR.dqnoNHi7eK5cRniwPEF5Mrq	3100000013	PRODUCTOR	2026-04-09 16:18:06.381634	t	8888888801	{"compras","productores"}	\N	1
60	Tomás	Restrepo	tomas.restrepo@campo.co	$2b$10$aVe7VFlWKv.oEAbcXdMCM./DZ91CPjBC9yeBf1LzlIShur30DoMCi	3100000014	PRODUCTOR	2026-04-09 16:18:06.461544	t	7777777701	{"compras","productores"}	\N	1
24	Jose	Gasca	jose@gmail.com	$2b$10$0EZ1r98LTbH7WcKHvNwcpOZqKeq5bCiAxSKEfchCzHxR2yclPOXPO	3202020450	OPERARIO	2026-03-18 23:12:22.163061	t	1117532009	{"dashboard","ventas"}	\N	1
58	hernando	Castro	email.dup.productor@campo.co	$2b$10$Hk5kTNkDG.JpMpWn59yxWebolOgxv09n9KrPgS/egQpNvoIONYpdO	3100000011	PRODUCTOR	2026-04-09 16:18:06.299213	t	9999999901	{"compras","productores"}	\N	1
46	carlos	mendoza	email.duplicado@agrotrace.co	$2b$10$OPNvAg6btHxLXGXyEEculuAqbIC/OJXTjrsDMiemgt7MdlA53S3Ga	3100000001	OPERARIO	2026-04-09 15:37:22.304663	t	9999999991	{"dashboard","ventas"}	\N	1
61	Alfredo	Ipus	alfredoipus2273@proplab.com	$2b$10$1E79hAwBBIgLlEUG1N6GyeT/cacQHPNHeSZHzO6eL4c6uTLrqxbYi	3144630600	PRODUCTOR	2026-04-26 09:40:20.19986	t	17682273	{"compras","productores"}	\N	1
62	Abelardo	Sarrias	abelardosarrias9197@proplab.com	$2b$10$q9yoVB.x43ngUf26KwPgz.POU.x68e8jmPKIYAvWW7p6jJ8vaNSB2	3185752723	PRODUCTOR	2026-04-26 09:40:20.30615	t	16189197	{"compras","productores"}	\N	1
63	Albeiro	Caldon	albeirocaldon1457@proplab.com	$2b$10$lGT9SjIaZMtzcyGwEy853.RR05OP2Wsw/Vo7RzC4bEq8xh7U/aCsG	\N	PRODUCTOR	2026-04-26 09:40:20.380797	t	1117511457	{"compras","productores"}	\N	1
64	Alexander	Valencia	alexandervalencia0740@proplab.com	$2b$10$TRHhjE90KPCIMRzpkHUDV.l6MRIBOcHbRi8tX2yI5.rwL1ZzNOyCC	3204481507	PRODUCTOR	2026-04-26 09:40:20.450876	t	1115790740	{"compras","productores"}	\N	1
65	Alfonso	María Yucuma	alfonsomariayucuma7055@proplab.com	$2b$10$A9DWWwuLkgExsb6W.ud6lerpTO9oJkQjQ.MVy/R9wwzI26QwMZn4O	\N	PRODUCTOR	2026-04-26 09:40:20.522802	t	4897055	{"compras","productores"}	\N	1
66	Alfredo	Gonzales Bonilla	alfredogonzalesbonilla3146@proplab.com	$2b$10$IVQ0H6PjQIIbEQs/bP8tueVPsF2TPRYU8wOZJCVwVKpb4Wq62BYfq	3102711858	PRODUCTOR	2026-04-26 09:40:20.594831	t	12193146	{"compras","productores"}	\N	1
67	Álvaro	Cantillo Patiño	alvarocantillopatino3334@proplab.com	$2b$10$g3TRS.lolW7jOlnRto7.qOx1oKDqAfj.I9rlTp/A5LNzZtDPy97BC	3144834741	PRODUCTOR	2026-04-26 09:40:20.665629	t	17683334	{"compras","productores"}	\N	1
68	Álvaro	Quintero	alvaroquintero4699@proplab.com	$2b$10$tcxh/bIOeJTve5Qp00JS8OJ3OkD6ORQsbKaxmMNoCUT06bjBxeci6	3124340139	PRODUCTOR	2026-04-26 09:40:20.73821	t	17684699	{"compras","productores"}	\N	1
69	Antonio	Antury	antonioantury0510@proplab.com	$2b$10$fM99wkmOA.xjDr68c6NITuaYfXrlXdt/aF6Yy4XMU2X5vHn9gZBH2	3123750793	PRODUCTOR	2026-04-26 09:40:20.809428	t	17680510	{"compras","productores"}	\N	1
70	Arcesio	Cali Liscano	arcesiocaliliscano4524@proplab.com	$2b$10$InFLIRlzGkNZUwwty/QC.evbOjzldVHqqWlAJClWsNRu9I4PUXESK	3228451021	PRODUCTOR	2026-04-26 09:40:20.882109	t	17684524	{"compras","productores"}	\N	1
71	Arelys	Villa Vargas	arelysvillavargas8297@proplab.com	$2b$10$tq21ivhsn5qkt5py4B1UhOKsjk3wMkgUKGjNkbrANS3YTNEvtVvHO	3112136401	PRODUCTOR	2026-04-26 09:40:20.948492	t	40778297	{"compras","productores"}	\N	1
72	Ariel	Ruano Ayala	arielruanoayala7025@proplab.com	$2b$10$i6r/PYVv0h2QRa2fgIs/kOc14NVv8IjfjBA6U2D427DFhRuw/jX9G	3106971415	PRODUCTOR	2026-04-26 09:40:21.016406	t	17647025	{"compras","productores"}	\N	1
73	Armando	Calderón Artunduaga	armandocalderonartunduaga4183@proplab.com	$2b$10$fwT1Ljfs.ZK1bGrC6upv3OV1GksndatFN5Dnet9pIkai7DuFqNP9W	3168236817	PRODUCTOR	2026-04-26 09:40:21.087132	t	17684183	{"compras","productores"}	\N	1
74	Arnulfo	Sánchez	arnulfosanchez4136@proplab.com	$2b$10$G6swxzz39g13kSwKbaH1zuNNHXt4SeUbg1EoSDsR0TG5z2JKCaJBu	3143031994	PRODUCTOR	2026-04-26 09:40:21.198503	t	17684136	{"compras","productores"}	\N	1
75	Blanca	Luz Martínez	blancaluzmartinez0310@proplab.com	$2b$10$1pUvcqBWO/8HxoUlIUCiO.iVo/coXG9IG5CgRGtitgWWN5CP8YJ7W	3124197596	PRODUCTOR	2026-04-26 09:40:21.267901	t	26630310	{"compras","productores"}	\N	1
76	Carlos Mauricio	García Zúñiga	carlosmauriciogarciazuniga8425@proplab.com	$2b$10$ijPCKcSm5JR/9Wn3K7Xi7ORRHI56vlqeoJOsmItyFB3vsCT2VzmgO	3183479541	PRODUCTOR	2026-04-26 09:40:21.337109	t	14248425	{"compras","productores"}	\N	1
77	Carolina	Calderón	carolinacalderon5950@proplab.com	$2b$10$jN3Zp/ou202yvSxyiKqtFOKWLheMCpnVBVBN4celyN8iYUPBfe/be	3228158814	PRODUCTOR	2026-04-26 09:40:21.404038	t	1115795950	{"compras","productores"}	\N	1
78	Cesar Tulio	Suarez Villanueva	cesartuliosuarezvillanueva2542@proplab.com	$2b$10$kklQwOfbiEr9dbaJogyEteJY22reVE.pftr8NIHnM5ff37QbvHpHi	3223680400	PRODUCTOR	2026-04-26 09:40:21.47046	t	17682542	{"compras","productores"}	\N	1
79	Cielo	Garzon Rojas	cielogarzonrojas1349@proplab.com	$2b$10$CLwc7dsf/.OZppfuV8zgH.4nV2iFTBPWwoQ8FyYdWZDq0tWaV3AWO	3005721308	PRODUCTOR	2026-04-26 09:40:21.543427	t	52121349	{"compras","productores"}	\N	1
80	Dagoberto	Florez Alonso	dagobertoflorezalonso3414@proplab.com	$2b$10$Wsy.Xn7b0XltGqMEM4YSu.lUZVFnnPUhQg3vEtmmjdMDJOplryy7.	3237385477	PRODUCTOR	2026-04-26 09:40:21.610191	t	93343414	{"compras","productores"}	\N	1
81	Daimer	Chica	daimerchica5356@proplab.com	$2b$10$noksUou7TtsJdj0enfK4Lun4C1Tk7S1YYFO4cMKDsXpP8V3KPMeP6	3172446632	PRODUCTOR	2026-04-26 09:40:21.678307	t	1117885356	{"compras","productores"}	\N	1
82	Damiana	Molina	damianamolina7688@proplab.com	$2b$10$ZoP10mPH0jG2GYDZIjBurOLhO1MveSx/yIJXgtixAOu9QDFPnSr3K	3144590319	PRODUCTOR	2026-04-26 09:40:21.746822	t	30507688	{"compras","productores"}	\N	1
83	Daniel	Pineda Pinzón	danielpinedapinzon4836@proplab.com	$2b$10$9uQZLvPDMn26XpqZtKceweBXlFoGNu9wjrRZ84.PqPrax1exo8WYK	3115284836	PRODUCTOR	2026-04-26 09:40:21.815323	t	1022394836	{"compras","productores"}	\N	1
84	Deibi	Johana Castro	deibijohanacastro3495@proplab.com	$2b$10$8ngdExWko/fr2d3TPlzbleVOc2IvqDzcehRIz2mIGJb.fkOyLcQe2	3228153122	PRODUCTOR	2026-04-26 09:40:21.884103	t	1115793495	{"compras","productores"}	\N	1
85	Deicy	Quimbayo Perilla	deicyquimbayoperilla2264@proplab.com	$2b$10$F.9JtT725/iRHfCS5XxcOOnMFCcb.7phrKZwuX5wCnTPvBjaZoimG	3158992427	PRODUCTOR	2026-04-26 09:40:21.953499	t	1115792264	{"compras","productores"}	\N	1
86	Diego	Alejandro Cortez	diegoalejandrocortez5523@proplab.com	$2b$10$RY6vThwpspierupMq8ugJuV/WuEWcbNcDKkPgKVcFUIHn02xZZXum	3125534439	PRODUCTOR	2026-04-26 09:40:22.023821	t	1115795523	{"compras","productores"}	\N	1
87	Dora	Lilia Rodriguez	doraliliarodriguez3536@proplab.com	$2b$10$33U5vwFlkBDR6nWJG7lYZuMAVXmfMj.LikOdx3Da11.eiEJHxtci2	\N	PRODUCTOR	2026-04-26 09:40:22.091739	t	40093536	{"compras","productores"}	\N	1
88	Edinson	Cuellar	edinsoncuellar2960@proplab.com	$2b$10$uwysSuiv0sNkT2N4Hd0rae0Kv5tM15t/KuNVgzSFQ6BHgp1gxwVcW	3183001125	PRODUCTOR	2026-04-26 09:40:22.161063	t	1006512960	{"compras","productores"}	\N	1
89	Elias	Quimbayo	eliasquimbayo5748@proplab.com	$2b$10$MIlBFgmUWnw7sU6EnlY2KOnPt5/oovw3jqr4Sc52lSMMHV3S5lrSu	3238698108	PRODUCTOR	2026-04-26 09:40:22.230484	t	1117885748	{"compras","productores"}	\N	1
90	Eliberto	Urbina	elibertourbina0233@proplab.com	$2b$10$PJnazcHk9V9m0HrRxo3EvuzkVAka6O6FwlKYpQFl8ea2e6UAbfzxy	\N	PRODUCTOR	2026-04-26 09:40:22.298669	t	12190233	{"compras","productores"}	\N	1
91	Erika	Muñoz	erikamunoz9392@proplab.com	$2b$10$n7F6U/mNS2F3mxbTYj/XqOO2J5Psp2s9k0.xC90.dP6j9LFjtJCMG	3008265604	PRODUCTOR	2026-04-26 09:40:22.367164	t	26649392	{"compras","productores"}	\N	1
92	Evert Alexis	Vargas Ome	evertalexisvargasome4574@proplab.com	$2b$10$ftJz1VKLlEQpNJ.wY1wTBuIx8HB/dNprL/jQx8EnFzt9PMbnEMrGy	3107874347	PRODUCTOR	2026-04-26 09:40:22.438992	t	1115794574	{"compras","productores"}	\N	1
93	Fabian	Yucuma Gansasoy	fabianyucumagansasoy4137@proplab.com	$2b$10$1ROTvnEA5Pp3eynXicvM6umBJbIO4ZV.ldGV6NkKLCN04XXulG0Ki	\N	PRODUCTOR	2026-04-26 09:40:22.508373	t	1115794137	{"compras","productores"}	\N	1
94	Ferlein	Perilla	ferleinperilla1163@proplab.com	$2b$10$BAsJCaamKUd2DC4EzE772uFcP1H9GwTRFwQTnSAAw5NTaw..wvXWy	\N	PRODUCTOR	2026-04-26 09:40:22.576513	t	1115791163	{"compras","productores"}	\N	1
95	Ferley	Quimbayo Castaño	ferleyquimbayocastano1792@proplab.com	$2b$10$3GqFNozHf6XFfbMrdmaDoecrDvwKSi23g1d/gU0c6QE7dTukBtLTC	3025796443	PRODUCTOR	2026-04-26 09:40:22.647059	t	1006521792	{"compras","productores"}	\N	1
96	Ferney	Darío Vaquero	ferneydariovaquero5131@proplab.com	$2b$10$fmkzYg9YkptM1sQRbFJgLOQx8iMyZ08wMaoI1fqrtrEUlR2idulzu	\N	PRODUCTOR	2026-04-26 09:40:22.714722	t	17685131	{"compras","productores"}	\N	1
97	Flor	Angela Ganzasoy	florangelaganzasoy4228@proplab.com	$2b$10$Efuj7UeeZLCo/QA1cOVewO9L5Upld9kBdRf3z.3axbsHfcfHCk8bu	3175088682	PRODUCTOR	2026-04-26 09:40:22.783523	t	1115794228	{"compras","productores"}	\N	1
98	Genry	Plazas	genryplazas4153@proplab.com	$2b$10$MYfjISAMvaw3tTocOmJpAOVv3zWyA7K1cpyBKKf1DrBeVbeKflhX6	\N	PRODUCTOR	2026-04-26 09:40:22.854541	t	17684153	{"compras","productores"}	\N	1
99	German De	Jesús Rico	germandejesusrico1097@proplab.com	$2b$10$N9YuyRJO07VSVt2HX7766eD6RvtnQUpBbZQXPgcOZRbqym2xjbT/m	\N	PRODUCTOR	2026-04-26 09:40:22.925453	t	16191097	{"compras","productores"}	\N	1
100	Gonzalo	Gómez	gonzalogomez2709@proplab.com	$2b$10$5N7hPdSKZ71GZYjtaCEiY.wbd3Iq4HIHfN5TbZT.MtW4NTYaaO5/W	3222676967	PRODUCTOR	2026-04-26 09:40:22.995078	t	17632709	{"compras","productores"}	\N	1
101	Gustavo	Jaimes	gustavojaimes5301@proplab.com	$2b$10$ASyhr.GgyvJWQGgX2/Pvbu4XPrmA0XgCVhLQz7mTUWJFqAJTR7x4S	3504108900	PRODUCTOR	2026-04-26 09:40:23.070496	t	1077855301	{"compras","productores"}	\N	1
102	Herminson	Gómez Ome	herminsongomezome2672@proplab.com	$2b$10$jXyj6rn90m/0vtA2CqzzI.oobtT1wXNFtYAQMBGNdJhNSeKFCaiwW	\N	PRODUCTOR	2026-04-26 09:40:23.13877	t	1115792672	{"compras","productores"}	\N	1
103	Huber	Yucuma	huberyucuma3305@proplab.com	$2b$10$r3SfOn4mp3tLVkmo1BtotOypWi4Dq4a3CZhRsU3lS7PD10v0oAeWy	\N	PRODUCTOR	2026-04-26 09:40:23.209471	t	1117493305	{"compras","productores"}	\N	1
104	Isauro	Triana Perdomo	isaurotrianaperdomo8422@proplab.com	$2b$10$D6DbW5yOJVZ803Rt1DnROu/fs2w/UMek/BQvvKA6oqJh7vtypSYPC	\N	PRODUCTOR	2026-04-26 09:40:23.278871	t	1115948422	{"compras","productores"}	\N	1
105	Israel	Castillo	israelcastillo3107@proplab.com	$2b$10$K3n9q0KRonWamMY6hpOkiu.9LWza8qqFSV8qubdFzHkYX6glpvX.W	\N	PRODUCTOR	2026-04-26 09:40:23.347623	t	17683107	{"compras","productores"}	\N	1
106	Jair	Olaya Ibarra	jairolayaibarra0783@proplab.com	$2b$10$cezNEFOgVsJ1GvTOOD1Z8O1j6ytqa.KV3y5tbm29LriaX9c9WYQrq	\N	PRODUCTOR	2026-04-26 09:40:23.414858	t	1080360783	{"compras","productores"}	\N	1
107	Jairo	Muñoz	jairomunoz1433@proplab.com	$2b$10$7wqNN3OOv1EKG.BrJbVVR.G9Kb7EUBzOfgdfJDejcUe/C.WerASMK	3184335638	PRODUCTOR	2026-04-26 09:40:23.484192	t	17681433	{"compras","productores"}	\N	1
108	Javier	Cárdenas Vega	javiercardenasvega9473@proplab.com	$2b$10$YwDFmaoqNNkp3GBqVdOFqecIJeVr2AymlZEqzh9zvqZulSSIrLZl2	3202160047	PRODUCTOR	2026-04-26 09:40:23.557762	t	17659473	{"compras","productores"}	\N	1
109	Jesica Andrea	Rojas Garzon	jesicaandrearojasgarzon7008@proplab.com	$2b$10$rHQjohtaeLm6sdiijEhK/.0MW7MS0cpeoxCNsb/0hTs4VHeabBzay	\N	PRODUCTOR	2026-04-26 09:40:23.627263	t	1078757008	{"compras","productores"}	\N	1
110	Jesús	Antonio Penagos	jesusantoniopenagos3615@proplab.com	$2b$10$eSHYKVJEx.uFiQ4n2LvQVOJJuOo79e8yJAEktPdYTZUDm4lTrbAtK	3024757059	PRODUCTOR	2026-04-26 09:40:23.698281	t	176443615	{"compras","productores"}	\N	1
111	Jesús Antonio	Penagos Hijo	jesusantoniopenagoshijo4186@proplab.com	$2b$10$jLEjxuILLK/Bp.ucOVK/muCJtrIv4uSkcF5V62pVIOx1XgQmBl0TK	3143038287	PRODUCTOR	2026-04-26 09:40:23.7681	t	1115794186	{"compras","productores"}	\N	1
112	Jhon	Edwin Torres	jhonedwintorres5436@proplab.com	$2b$10$E.aZFreYfD2QcssIDHY3peDdm6PydTtIX2nHe4Taw3xXQ9Np8KDci	\N	PRODUCTOR	2026-04-26 09:40:23.839119	t	1117525436	{"compras","productores"}	\N	1
113	Jhurany	Parra Cierra	jhuranyparracierra5324@proplab.com	$2b$10$oFclf8XbCbBCqQLxet1h6.ol1oQC2SzC5uVhQEYPhFiUwTWCPCONO	\N	PRODUCTOR	2026-04-26 09:40:23.906388	t	1115795324	{"compras","productores"}	\N	1
114	Johana	Jiménez Ome	johanajimenezome0235@proplab.com	$2b$10$9WyWTzL1A/jGzaNWN./VTOqFhoJ3/fIy7n.YtakqnlOnt70NXuXmi	3212625759	PRODUCTOR	2026-04-26 09:40:23.973684	t	1006410235	{"compras","productores"}	\N	1
115	Jorge	Ramada Arango	jorgeramadaarango9116@proplab.com	$2b$10$oqnP5Xm7l0QZK8e4m4GKxu6830hfX8eVR7ge9NVVvHtDxDwC/qiLW	3195389457	PRODUCTOR	2026-04-26 09:40:24.040798	t	17689116	{"compras","productores"}	\N	1
116	Jorge	Torres	jorgetorres4150@proplab.com	$2b$10$3CoSI7w1p9Z7.lZHXvCkT.1/DSY44mdIzWJCYQ3WM3hRDKkoeCOtO	\N	PRODUCTOR	2026-04-26 09:40:24.109893	t	17684150	{"compras","productores"}	\N	1
117	Jose Antonio	Rada Arriguí	joseantonioradaarrigui3498@proplab.com	$2b$10$l6WtS7P8qCpgJqHv.wKJguKOElFjIwCjfFRLvgq2DUDJmRv4P1Oyq	3214293103	PRODUCTOR	2026-04-26 09:40:24.185619	t	1115793498	{"compras","productores"}	\N	1
118	José	Anyerson Carvajal	joseanyersoncarvajal3072@proplab.com	$2b$10$6pBNYkChnH.cAbfTfgfZGe0mI/hFAIar2CANqCqFKuLDthvqXLuYO	3028290081	PRODUCTOR	2026-04-26 09:40:24.255433	t	1115793072	{"compras","productores"}	\N	1
119	José	Daniel Salamanca	josedanielsalamanca4672@proplab.com	$2b$10$WmSjM6NMsbHY1OtR.W2S4uGjh0sGhziCS2f1eVzLPyoKv3YcRvHJG	3115681573	PRODUCTOR	2026-04-26 09:40:24.323284	t	6804672	{"compras","productores"}	\N	1
120	José Eladio	Castillo Jacobo	joseeladiocastillojacobo4109@proplab.com	$2b$10$GU/Yx0JDpPrD8XzpuIW9huyO/OLhUoA8.vZQPWndRoxavfl6RBpr6	\N	PRODUCTOR	2026-04-26 09:40:24.389254	t	17684109	{"compras","productores"}	\N	1
121	Jose Elver	Gaviria Mutumbajoy	joseelvergaviriamutumbajoy1410@proplab.com	$2b$10$kKez.Rau30x56REPQEPos.yq2d6j0JeymuQoN7Joe2cx80AsoPKZm	\N	PRODUCTOR	2026-04-26 09:40:24.45543	t	1007451410	{"compras","productores"}	\N	1
122	Jose Fernando	Larrota Caldon	josefernandolarrotacaldon2344@proplab.com	$2b$10$zFnhIKc38ZZaawz9YGZwB.ue1u4Aty6TVV2iNn4Atc.12V1RiZBw2	3115481133	PRODUCTOR	2026-04-26 09:40:24.526382	t	1115792344	{"compras","productores"}	\N	1
123	José William	Reyes Parra	josewilliamreyesparra7078@proplab.com	$2b$10$1SM9ya7ujgZN0diXO7ODBuboQ.gQm0yj0OazKluFUsb.fQn.xnFVK	3214615925	PRODUCTOR	2026-04-26 09:40:24.596291	t	17647078	{"compras","productores"}	\N	1
124	Joselino	Tunubala	joselinotunubala7382@proplab.com	$2b$10$Ktcr07rDouTy9kSpq0P4f.OOJeC9qn8bUsW0TyvRY82Em.SnZ8A7G	\N	PRODUCTOR	2026-04-26 09:40:24.663035	t	10537382	{"compras","productores"}	\N	1
125	Juan	Carlos Montealegre	juancarlosmontealegre1097@proplab.com	$2b$10$M8WilOPIrv45SwY9hda/Q.PNvJrrGy7z6Kk0v/WCkoCzX7kN81AXi	\N	PRODUCTOR	2026-04-26 09:40:24.732998	t	1115791097	{"compras","productores"}	\N	1
126	Leonel	Quimbayo Castaño	leonelquimbayocastano1714@proplab.com	$2b$10$7xAoaYNUtzSLD/qq2PGTrOafP8Mc3cSr6esTcLnmBH5E.DY5mNvOS	3134846308	PRODUCTOR	2026-04-26 09:40:24.802749	t	1006521714	{"compras","productores"}	\N	1
127	Libardo	Carvajal Silva	libardocarvajalsilva3650@proplab.com	$2b$10$gI9faiRhvFKm2P8O5TV4Buc3TXIR/OVjYMzryOaVzxs4qJ/KRjve6	\N	PRODUCTOR	2026-04-26 09:40:24.880665	t	1115793650	{"compras","productores"}	\N	1
128	Lino Antonio	Figueroa Gomez	linoantoniofigueroagomez7241@proplab.com	$2b$10$hjmDikZe8oic1mD7QQOiV.Kgg.L6ipHEMEIBn8JmNO4.Is5KH02/y	\N	PRODUCTOR	2026-04-26 09:40:24.961237	t	83057241	{"compras","productores"}	\N	1
129	Lorenso	Campos Carvajal	lorensocamposcarvajal4807@proplab.com	$2b$10$Kg5jhJFnwRZqrDRNs8O2/O6JZmjhletLT5CCVNvEWimQ/T3RsmGzK	\N	PRODUCTOR	2026-04-26 09:40:25.039336	t	17684807	{"compras","productores"}	\N	1
130	Luceli	Rodríguez	lucelirodriguez7516@proplab.com	$2b$10$gH9EgStqbFVqmEXB.9UzuegTCKr8ZXHSkeJ33sULxYzmtC8g.rPK6	3144890786	PRODUCTOR	2026-04-26 09:40:25.111	t	1012327516	{"compras","productores"}	\N	1
131	Lucero	Sanchez Mendez	lucerosanchezmendez2485@proplab.com	$2b$10$KD3ha4gTRCJ2osrwG/KlL.BCNMd5PtPClPwScyydJKZetTRD.UQsy	3212153717	PRODUCTOR	2026-04-26 09:40:25.179775	t	1006502485	{"compras","productores"}	\N	1
132	Lucrecia	Becerra Tapia	lucreciabecerratapia6378@proplab.com	$2b$10$mA8T29VREmtgcgPEoK9cJ.ge6bIrfI./dTx5C4/x7WIWLK9PemdTm	\N	PRODUCTOR	2026-04-26 09:40:25.251264	t	40766378	{"compras","productores"}	\N	1
133	Luis	Álvaro Arias	luisalvaroarias3907@proplab.com	$2b$10$y/l.aZGdRN2eoam2Ujkz0.w8pbCKX9x1nkyByvet/1elNe792qRrm	\N	PRODUCTOR	2026-04-26 09:40:25.322349	t	17683907	{"compras","productores"}	\N	1
134	Luis	Aníbal Lugo	luisaniballugo4410@proplab.com	$2b$10$DUBHCzCKCryHSGdB4nJQ..jZOtUgAdWcM8KIVaDk2zbou54CfGL1.	3236401788	PRODUCTOR	2026-04-26 09:40:25.392084	t	17654410	{"compras","productores"}	\N	1
135	Luis	Eduardo Montealegre	luiseduardomontealegre5481@proplab.com	$2b$10$3tuQjN6MEloJEPs8G3SAteTv051F8s93wz.gG3svvS8dO9im2u5E6	\N	PRODUCTOR	2026-04-26 09:40:25.459338	t	1115795481	{"compras","productores"}	\N	1
136	Magnolia	Hurtado Varon	magnoliahurtadovaron9805@proplab.com	$2b$10$4rU2zKX9kQmrKad3.YqJKuHF7QWJ9Hjw2L8Pq5leRPxg8gIqyt4qO	\N	PRODUCTOR	2026-04-26 09:40:25.528216	t	40769805	{"compras","productores"}	\N	1
137	Margot	Chica Gómez	margotchicagomez4511@proplab.com	$2b$10$Zhx/j/0uA63PY.r7NroFC.zmmehLQejPGGcIZTPBdHfW2LEBCgPke	\N	PRODUCTOR	2026-04-26 09:40:25.598912	t	1117884511	{"compras","productores"}	\N	1
138	María	Ninfa Capera	marianinfacapera5324@proplab.com	$2b$10$R25PKuggSAkNgruwH0HnnOJnJHnJjHRff/qBIzYgI3CIcR5mnfXEW	\N	PRODUCTOR	2026-04-26 09:40:25.671328	t	40595324	{"compras","productores"}	\N	1
139	Mauricio	Aldana	mauricioaldana4400@proplab.com	$2b$10$mq8jTqnYdVNNU4B6gIBGbOUE5satNKLQEbAQetKtVluIIyzEI4QWO	\N	PRODUCTOR	2026-04-26 09:40:25.741979	t	17684400	{"compras","productores"}	\N	1
140	Miguel	Ángel Cantillo	miguelangelcantillo3008@proplab.com	$2b$10$rz1CFdt5WUpOH54wITiM2.ky94yQZjR.w.xrbzDDD0R66SMzk0Ngq	3144636071	PRODUCTOR	2026-04-26 09:40:25.812788	t	96313008	{"compras","productores"}	\N	1
141	Neisy	Rico	neisyrico1882@proplab.com	$2b$10$3EhingMPFKYv7DISq2zMy.QPhJdq/TkApysdPlfjLlifzS8FWqdvG	\N	PRODUCTOR	2026-04-26 09:40:25.884744	t	40081882	{"compras","productores"}	\N	1
142	Nelcy	Llanos Ríos	nelcyllanosrios9158@proplab.com	$2b$10$l5hM0Ylho2E3YsNAQPv1yunC20q8x21a2aCBTcU9kyspGICrRZl72	3174201464	PRODUCTOR	2026-04-26 09:40:25.959236	t	1117489158	{"compras","productores"}	\N	1
143	Nelson	Ome	nelsonome4135@proplab.com	$2b$10$9qmTxlcTeQAZ/RnF9mSNr.ZlZLRS2HnFFnJxvraQOCr7zdGcfXfty	3238638233	PRODUCTOR	2026-04-26 09:40:26.033577	t	17684135	{"compras","productores"}	\N	1
144	Nelson	Osorio	nelsonosorio2948@proplab.com	$2b$10$j5xG/X73cK6RBGDRBZCxte0QlEnwgWNazkjV/lpktNljjTZzc2nBO	\N	PRODUCTOR	2026-04-26 09:40:26.106549	t	4962948	{"compras","productores"}	\N	1
145	Nelson	Yucuma	nelsonyucuma2350@proplab.com	$2b$10$NVQ4X01Cka08HScyfs2iUOcXw9CNGb3C2UfTqhBNz.GTGKX5./oaO	3238698093	PRODUCTOR	2026-04-26 09:40:26.2035	t	1115792350	{"compras","productores"}	\N	1
146	Norma Costanza	Bonillas Ríos	normacostanzabonillasrios6107@proplab.com	$2b$10$0E1X5nVvNU4BG4n17oKZfeAH9MQaA0d195Bm1hX.l23S40I0yF6F6	3153317517	PRODUCTOR	2026-04-26 09:40:26.277201	t	51816107	{"compras","productores"}	\N	1
147	Ofelia	Sotto Correa	ofeliasottocorrea0334@proplab.com	$2b$10$8c/gn34BWxVJpPGhw4Oqt.czBMgEmdjSDNEqosjVKBr7.mbAW/Da6	3222342809	PRODUCTOR	2026-04-26 09:40:26.350658	t	26630334	{"compras","productores"}	\N	1
148	Olimpo	Cárdenas Vega	olimpocardenasvega3121@proplab.com	$2b$10$H7nFg7RAN7C9lNgT6k.waO9olxVb31mvlUcXX9U18oh9SwVHyZwfK	\N	PRODUCTOR	2026-04-26 09:40:26.420888	t	17683121	{"compras","productores"}	\N	1
149	Oliverio	Cantillo	oliveriocantillo4436@proplab.com	$2b$10$YSltjdoTIS3PrktjqTFexuU1RBzLvsmZAY/9h5maJLOKCVR.d7rF.	\N	PRODUCTOR	2026-04-26 09:40:26.49643	t	17684436	{"compras","productores"}	\N	1
150	Olmes	Cerquera	olmescerquera4948@proplab.com	$2b$10$4So8ji7G1ODDuM387bzSpufyRvfl6hChSXukFdxcFZKtcJRDv07ju	3247217565	PRODUCTOR	2026-04-26 09:40:26.567925	t	17684948	{"compras","productores"}	\N	1
151	Omar	Ortiz Matiz	omarortizmatiz6371@proplab.com	$2b$10$a0GnkJ1gCN5N94QvMfzm0.D0W9Mkez2Lv4NYG0Bk3rHAmL2kQ06e6	\N	PRODUCTOR	2026-04-26 09:40:26.641759	t	19276371	{"compras","productores"}	\N	1
152	Orlando	Murcia Bermeo	orlandomurciabermeo4928@proplab.com	$2b$10$ydvwcPFyBM0kfm8TXVzdiu4dqzUCRj9XIxWOUZd9F87g5/zxibn6u	3027495194	PRODUCTOR	2026-04-26 09:40:26.712814	t	96354928	{"compras","productores"}	\N	1
153	Orlando	Silva	orlandosilva2033@proplab.com	$2b$10$SJ/bcRnOCr0Pts.ihcQzF.DU7vrqS7NrKr5LWTyloaaIvdHzbQtAW	\N	PRODUCTOR	2026-04-26 09:40:26.78696	t	17682033	{"compras","productores"}	\N	1
154	Orlay	Ome	orlayome7927@proplab.com	$2b$10$l11Ro5vmqyZ3kkGaAvijJePVDkI8ubVpM62YQMneD764mKx0OIvia	\N	PRODUCTOR	2026-04-26 09:40:26.857847	t	17187927	{"compras","productores"}	\N	1
155	Pedro	Jiménez	pedrojimenez1167@proplab.com	$2b$10$doZAkfCBoSZ/SkLYZt5Kf.OanO6yEZV3TvDi/OBrLsbn9dCAzwPVu	3223936481	PRODUCTOR	2026-04-26 09:40:26.933495	t	17681167	{"compras","productores"}	\N	1
156	Pedro	Piamba	pedropiamba0826@proplab.com	$2b$10$x72Kb9.OuCGnInLATWhTRuwZohEg77eQysOetmXMJHNhLRg3LF2Oa	\N	PRODUCTOR	2026-04-26 09:40:27.006103	t	17650826	{"compras","productores"}	\N	1
157	Rafael	Calderón	rafaelcalderon8011@proplab.com	$2b$10$ecuKsVsXQcBR/eT5laCsWuikhZjSb3HoqwZN90xG5.GyIUXx9XSVq	\N	PRODUCTOR	2026-04-26 09:40:27.078353	t	17618011	{"compras","productores"}	\N	1
158	Rafael	Calderón Cuenca	rafaelcalderoncuenca4772@proplab.com	$2b$10$Oj6jlInwXzdLyM1omTVV.OVEt.8kJIH4MqZLQNDzlj2RyOczwQSkG	\N	PRODUCTOR	2026-04-26 09:40:27.149724	t	17684772	{"compras","productores"}	\N	1
159	Rafael	Garzón	rafaelgarzon0540@proplab.com	$2b$10$PuCrmuKcpy9/pQYB8QpCxeQIXgffGjF/LoxHwict0.a30urm8Z8Di	\N	PRODUCTOR	2026-04-26 09:40:27.218232	t	17680540	{"compras","productores"}	\N	1
160	Ricardo	Moreno	ricardomoreno1911@proplab.com	$2b$10$UeHEwpHpeW3aLlzXKtyIrOsudErRIR60e5bQzIcg8zUU5HP2jTJH.	3025473093	PRODUCTOR	2026-04-26 09:40:27.28965	t	93451911	{"compras","productores"}	\N	1
161	Ricardo	Valenzuela Ospina	ricardovalenzuelaospina4250@proplab.com	$2b$10$DLWcnx2zvLRv9BkyDk25p.xYpL3A6gwYX.bBVk6KpfW5oyVRY2aWu	\N	PRODUCTOR	2026-04-26 09:40:27.357509	t	17684250	{"compras","productores"}	\N	1
162	Robedier	Piedrahita	robedierpiedrahita4998@proplab.com	$2b$10$ktxO9eRtjL7mlAnXHD8.xONlxd7UxJ.DXJjYTtxFhJ.2Nv4UVj5Eu	\N	PRODUCTOR	2026-04-26 09:40:27.42541	t	111794998	{"compras","productores"}	\N	1
163	Rómulo	Vargas	romulovargas4882@proplab.com	$2b$10$OQmQ0xQdmaolzejVJjttc.eshEQ9sPlOCrPJP526LGiNKjCLEFgzS	3156856411	PRODUCTOR	2026-04-26 09:40:27.493669	t	17684882	{"compras","productores"}	\N	1
164	Rosalba	Zoto	rosalbazoto3221@proplab.com	$2b$10$wH7ZmoclxBJNISEbMFCre.1gHShBtCZpPpLrJER51pif8sjRyl6Ei	\N	PRODUCTOR	2026-04-26 09:40:27.562357	t	40093221	{"compras","productores"}	\N	1
165	Samuel	Ruano Zambrano	samuelruanozambrano0010@proplab.com	$2b$10$o7af2QKuVXP7.ofBB/YkmOxzM92bk7VzUlnF8qFaL9bQnyiVhtaSG	3214895601	PRODUCTOR	2026-04-26 09:40:27.633778	t	1117530010	{"compras","productores"}	\N	1
166	Tomas	Vargas Perdomo	tomasvargasperdomo8004@proplab.com	$2b$10$ouPCASmoT9YWfTHnHP2/IO8U9GeasUkqla8awdSlciJMhupRit8jS	3027232876	PRODUCTOR	2026-04-26 09:40:27.701629	t	17728004	{"compras","productores"}	\N	1
167	Ubency	Cerquera	ubencycerquera0851@proplab.com	$2b$10$4mMbngKjTIs5NdgThze9N.DxNW6TpNXIQlJlNUV1Zm.RBeDIpKNtq	3144819574	PRODUCTOR	2026-04-26 09:40:27.767143	t	1115790851	{"compras","productores"}	\N	1
168	Uldarico	Rojas Sanza	uldaricorojassanza1572@proplab.com	$2b$10$.pX6yNc5ua8tbEBx2GlJVe5rgJ7j1zLc5/zcb7evS4YsNlRZIyTjm	\N	PRODUCTOR	2026-04-26 09:40:27.837609	t	17681572	{"compras","productores"}	\N	1
169	Victor	Arizaldo Pabon	victorarizaldopabon2480@proplab.com	$2b$10$Q2SZWMZAEDc6Lgez4/7BVOead5KWfIFZvy0S.TED6YhTXkbwNXj3O	3125669262	PRODUCTOR	2026-04-26 09:40:27.908407	t	16272480	{"compras","productores"}	\N	1
170	Víctor	Hugo Perilla	victorhugoperilla1253@proplab.com	$2b$10$kTeArNG90/dlyZFwfHu0D.b87PtvJQfIAWqK1Fk7MWlkwZPZt2kvm	3125831405	PRODUCTOR	2026-04-26 09:40:27.977558	t	1115791253	{"compras","productores"}	\N	1
171	Viviana	Patricia Caldon	vivianapatriciacaldon0964@proplab.com	$2b$10$7vlXWNVemRg47rJjJL4XtutzbSsfCOb9rzlXUnO943WGClWpIRasi	3127087879	PRODUCTOR	2026-04-26 09:40:28.047433	t	1115790964	{"compras","productores"}	\N	1
172	Yazmin	Buesaquillo	yazminbuesaquillo4237@proplab.com	$2b$10$cFkWxcpu13Apwo38eQjP.eUoyJ9EYG9pRz0hYqEG8f01.DRum15q.	3224746838	PRODUCTOR	2026-04-26 09:40:28.116369	t	40094237	{"compras","productores"}	\N	1
\.


--
-- TOC entry 5283 (class 0 OID 24927)
-- Dependencies: 242
-- Data for Name: venta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.venta (id_venta, id_operario, fecha_venta, cliente, total, estado, numero_factura, activo, id_comerciante, asociacion_id) FROM stdin;
2	1	2026-03-11	Cliente Prueba	100000.00	completada	FV-1001	t	\N	1
118	2	2026-04-15	Galeria	442200.00	completada	FV-20260415-5250	t	2	1
95	2	2026-04-10	Galeria	70400.00	COMPLETADO	FV-20260410-9468	t	\N	1
97	2	2026-04-10	El primo	221400.00	COMPLETADO	FV-20260410-5992	t	\N	1
96	2	2026-04-10	El primo	491400.00	COMPLETADO	FV-20260410-8670	t	\N	1
98	2	2026-04-10	Galeria	275500.00	COMPLETADO	FV-20260410-7745	t	\N	1
99	2	2026-04-10	Galeria	220000.00	COMPLETADO	FV-20260410-3708	t	\N	1
120	2	2026-04-16	Galeria	190000.00	completada	FV-20260416-6972	t	2	1
100	2	2026-04-10	Galeria	38400.00	completado	FV-20260410-1511	t	\N	1
101	2	2026-04-10	Galeria	514800.00	completado	FV-20260410-3494	t	\N	1
102	2	2026-04-10	Galeria	268400.00	completada	FV-20260410-4046	t	\N	1
121	2	2026-04-17	Galeria	488400.00	completada	FV-20260417-9371	t	2	1
103	2	2026-04-10	Galeria	38400.00	completada	FV-20260410-2874	t	\N	1
104	2	2026-04-10	Galeria	26400.00	COMPLETADO	FV-20260410-7765	t	\N	1
74	2	2026-03-22	Sin comerciante	48300.00	pendiente	FV-20260322-0074	t	\N	1
75	2	2026-03-22	Sin comerciante	48300.00	pendiente	FV-20260322-0075	t	\N	1
76	2	2026-03-22	Galeria	113400.00	completada	FV-20260322-0076	t	\N	1
77	2	2026-03-22	El primo	1600000.00	completada	FV-20260322-2582	t	\N	1
105	2	2026-04-10	Galeria	514800.00	COMPLETADO	FV-20260410-7651	t	\N	1
106	2	2026-04-10	Galeria	46200.00	pendiente	FV-20260410-4116	t	\N	1
107	2	2026-04-11	Galeria	172800.00	pendiente	FV-20260410-3889	t	\N	1
83	2	2026-03-31	El primo	2400000.00	pendiente	FV-20260331-6559	t	\N	1
84	2	2026-03-31	Galeria	160000.00	completada	FV-20260331-7376	t	\N	1
108	2	2026-04-10	Galeria	514800.00	pendiente	FV-20260410-7504	t	\N	1
85	2	2026-04-01	Galeria	102400.00	completada	FV-20260331-1526	t	\N	1
86	2	2026-04-01	El primo	160000.00	completada	FV-20260331-7536	t	\N	1
109	2	2026-04-10	Galeria	14250.00	pendiente	FV-20260410-1469	t	\N	1
87	2	2026-04-01	Galeria	48300.00	completada	FV-20260331-9853	t	\N	1
110	2	2026-04-10	Galeria	320000.00	pendiente	FV-20260410-2056	t	\N	1
111	2	2026-04-11	Galeria	22000.00	pendiente	FV-20260411-2641	t	\N	1
122	2	2026-04-22	El primo	43200.00	completada	FV-20260422-5969	t	1	1
112	2	2026-04-12	Galeria	2640000.00	completado	FV-20260412-4990	t	\N	1
113	2	2026-04-14	Galeria	26400.00	pendiente	FV-20260414-7244	t	\N	1
119	2	2026-04-15	Galeria	270600.00	completada	FV-20260415-7881	t	2	1
114	2	2026-04-14	Galeria	270600.00	completado	FV-20260414-2559	t	\N	1
117	2	2026-04-15	Galeria	26400.00	completada	FV-20260415-2963	t	2	1
115	2	2026-04-15	Galeria	270600.00	completada	FV-20260415-7710	t	\N	1
116	2	2026-04-15	Galeria	440000.00	completada	FV-20260415-9315	t	\N	1
124	2	2026-04-24	El primo	39600.00	completada	FV-20260424-8954	t	1	1
123	2	2026-04-24	El primo	44100.00	completada	FV-20260424-7518	t	1	1
125	2	2026-04-24	Galeria	710314.00	completada	FV-20260424-4556	t	2	1
126	2	2026-04-24	Galeria	50600.00	pendiente	FV-20260424-7458	t	2	1
127	2	2026-04-24	El primo	1688051.00	completada	FV-20260424-9126	t	1	1
128	2	2026-04-27	El primo	21900000.00	completada	FV-20260427-8721	t	1	1
\.


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 219
-- Name: administrador_id_administrador_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.administrador_id_administrador_seq', 1, false);


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 271
-- Name: asociaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asociaciones_id_seq', 4, true);


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 247
-- Name: codigo_qr_id_qr_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.codigo_qr_id_qr_seq', 1, false);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 259
-- Name: comerciante_id_comerciante_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comerciante_id_comerciante_seq', 2, true);


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 237
-- Name: compra_id_compra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compra_id_compra_seq', 3, true);


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 251
-- Name: confirmacion_ruta_id_confirmacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.confirmacion_ruta_id_confirmacion_seq', 1, false);


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 239
-- Name: detalle_compra_id_detalle_compra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_compra_id_detalle_compra_seq', 6, true);


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 243
-- Name: detalle_venta_id_detalle_venta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_venta_id_detalle_venta_seq', 48, true);


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 261
-- Name: entrega_id_entrega_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entrega_id_entrega_seq', 189, true);


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 229
-- Name: historial_precio_id_historial_precio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_precio_id_historial_precio_seq', 1, false);


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 245
-- Name: historial_transaccion_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_transaccion_id_historial_seq', 2, true);


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 257
-- Name: modo_offline_id_offline_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modo_offline_id_offline_seq', 1, false);


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 221
-- Name: operario_id_operario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operario_id_operario_seq', 2, true);


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 225
-- Name: perfil_productor_id_perfil_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.perfil_productor_id_perfil_seq', 1, false);


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 263
-- Name: precios_id_precio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.precios_id_precio_seq', 8, true);


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 231
-- Name: produccion_id_produccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produccion_id_produccion_seq', 10, true);


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 227
-- Name: producto_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_id_producto_seq', 6, true);


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 223
-- Name: productor_id_productor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productor_id_productor_seq', 168, true);


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 233
-- Name: proyeccion_id_proyeccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyeccion_id_proyeccion_seq', 1, false);


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 255
-- Name: ranking_productor_id_ranking_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ranking_productor_id_ranking_seq', 1, false);


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 253
-- Name: reporte_id_reporte_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reporte_id_reporte_seq', 1, false);


--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 265
-- Name: ruta_id_ruta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ruta_id_ruta_seq', 14, true);


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 249
-- Name: ruta_planificacion_id_ruta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ruta_planificacion_id_ruta_seq', 1, false);


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 217
-- Name: sesion_id_sesion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sesion_id_sesion_seq', 1, false);


--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 267
-- Name: stock_id_stock_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_id_stock_seq', 6, true);


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 269
-- Name: stock_movimiento_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stock_movimiento_id_movimiento_seq', 86, true);


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 235
-- Name: tendencia_id_tendencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tendencia_id_tendencia_seq', 1, false);


--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 215
-- Name: usuario_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_usuario_seq', 172, true);


--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 241
-- Name: venta_id_venta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.venta_id_venta_seq', 128, true);


--
-- TOC entry 4980 (class 2606 OID 24762)
-- Name: administrador administrador_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT administrador_id_usuario_key UNIQUE (id_usuario);


--
-- TOC entry 4982 (class 2606 OID 24760)
-- Name: administrador administrador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT administrador_pkey PRIMARY KEY (id_administrador);


--
-- TOC entry 5066 (class 2606 OID 33382)
-- Name: asociaciones asociaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asociaciones
    ADD CONSTRAINT asociaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 33384)
-- Name: asociaciones asociaciones_subdominio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asociaciones
    ADD CONSTRAINT asociaciones_subdominio_key UNIQUE (subdominio);


--
-- TOC entry 5026 (class 2606 OID 24986)
-- Name: codigo_qr codigo_qr_codigo_qr_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_qr
    ADD CONSTRAINT codigo_qr_codigo_qr_key UNIQUE (codigo_qr);


--
-- TOC entry 5028 (class 2606 OID 24984)
-- Name: codigo_qr codigo_qr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_qr
    ADD CONSTRAINT codigo_qr_pkey PRIMARY KEY (id_qr);


--
-- TOC entry 5040 (class 2606 OID 25086)
-- Name: comerciante comerciante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciante
    ADD CONSTRAINT comerciante_pkey PRIMARY KEY (id_comerciante);


--
-- TOC entry 5010 (class 2606 OID 24898)
-- Name: compra compra_numero_factura_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_numero_factura_key UNIQUE (numero_factura);


--
-- TOC entry 5012 (class 2606 OID 24896)
-- Name: compra compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_pkey PRIMARY KEY (id_compra);


--
-- TOC entry 5032 (class 2606 OID 25022)
-- Name: confirmacion_ruta confirmacion_ruta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.confirmacion_ruta
    ADD CONSTRAINT confirmacion_ruta_pkey PRIMARY KEY (id_confirmacion);


--
-- TOC entry 5015 (class 2606 OID 24915)
-- Name: detalle_compra detalle_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT detalle_compra_pkey PRIMARY KEY (id_detalle_compra);


--
-- TOC entry 5022 (class 2606 OID 24947)
-- Name: detalle_venta detalle_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_pkey PRIMARY KEY (id_detalle_venta);


--
-- TOC entry 5043 (class 2606 OID 25101)
-- Name: entrega entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega
    ADD CONSTRAINT entrega_pkey PRIMARY KEY (id_entrega);


--
-- TOC entry 5002 (class 2606 OID 24840)
-- Name: historial_precio historial_precio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precio
    ADD CONSTRAINT historial_precio_pkey PRIMARY KEY (id_historial_precio);


--
-- TOC entry 5024 (class 2606 OID 24965)
-- Name: historial_transaccion historial_transaccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_transaccion
    ADD CONSTRAINT historial_transaccion_pkey PRIMARY KEY (id_historial);


--
-- TOC entry 5038 (class 2606 OID 25064)
-- Name: modo_offline modo_offline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modo_offline
    ADD CONSTRAINT modo_offline_pkey PRIMARY KEY (id_offline);


--
-- TOC entry 4984 (class 2606 OID 24776)
-- Name: operario operario_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operario
    ADD CONSTRAINT operario_id_usuario_key UNIQUE (id_usuario);


--
-- TOC entry 4986 (class 2606 OID 24774)
-- Name: operario operario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operario
    ADD CONSTRAINT operario_pkey PRIMARY KEY (id_operario);


--
-- TOC entry 4995 (class 2606 OID 24811)
-- Name: perfil_productor perfil_productor_id_productor_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_productor
    ADD CONSTRAINT perfil_productor_id_productor_key UNIQUE (id_productor);


--
-- TOC entry 4997 (class 2606 OID 24809)
-- Name: perfil_productor perfil_productor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_productor
    ADD CONSTRAINT perfil_productor_pkey PRIMARY KEY (id_perfil);


--
-- TOC entry 5054 (class 2606 OID 33278)
-- Name: precios precios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precios
    ADD CONSTRAINT precios_pkey PRIMARY KEY (id_precio);


--
-- TOC entry 5004 (class 2606 OID 24853)
-- Name: produccion produccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion
    ADD CONSTRAINT produccion_pkey PRIMARY KEY (id_produccion);


--
-- TOC entry 5000 (class 2606 OID 24827)
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 4989 (class 2606 OID 25075)
-- Name: productor productor_codigo_qr_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productor
    ADD CONSTRAINT productor_codigo_qr_key UNIQUE (codigo_qr);


--
-- TOC entry 4991 (class 2606 OID 24792)
-- Name: productor productor_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productor
    ADD CONSTRAINT productor_id_usuario_key UNIQUE (id_usuario);


--
-- TOC entry 4993 (class 2606 OID 24790)
-- Name: productor productor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productor
    ADD CONSTRAINT productor_pkey PRIMARY KEY (id_productor);


--
-- TOC entry 5006 (class 2606 OID 24870)
-- Name: proyeccion proyeccion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyeccion
    ADD CONSTRAINT proyeccion_pkey PRIMARY KEY (id_proyeccion);


--
-- TOC entry 5036 (class 2606 OID 25049)
-- Name: ranking_productor ranking_productor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_productor
    ADD CONSTRAINT ranking_productor_pkey PRIMARY KEY (id_ranking);


--
-- TOC entry 5034 (class 2606 OID 25037)
-- Name: reporte reporte_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporte
    ADD CONSTRAINT reporte_pkey PRIMARY KEY (id_reporte);


--
-- TOC entry 5058 (class 2606 OID 33304)
-- Name: ruta ruta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta
    ADD CONSTRAINT ruta_pkey PRIMARY KEY (id_ruta);


--
-- TOC entry 5030 (class 2606 OID 25007)
-- Name: ruta_planificacion ruta_planificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta_planificacion
    ADD CONSTRAINT ruta_planificacion_pkey PRIMARY KEY (id_ruta);


--
-- TOC entry 4976 (class 2606 OID 24744)
-- Name: sesion sesion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_pkey PRIMARY KEY (id_sesion);


--
-- TOC entry 4978 (class 2606 OID 24746)
-- Name: sesion sesion_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_token_key UNIQUE (token);


--
-- TOC entry 5060 (class 2606 OID 33341)
-- Name: stock stock_id_producto_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_id_producto_key UNIQUE (id_producto);


--
-- TOC entry 5064 (class 2606 OID 33357)
-- Name: stock_movimiento stock_movimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movimiento
    ADD CONSTRAINT stock_movimiento_pkey PRIMARY KEY (id_movimiento);


--
-- TOC entry 5062 (class 2606 OID 33339)
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id_stock);


--
-- TOC entry 5008 (class 2606 OID 24883)
-- Name: tendencia tendencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tendencia
    ADD CONSTRAINT tendencia_pkey PRIMARY KEY (id_tendencia);


--
-- TOC entry 4970 (class 2606 OID 33393)
-- Name: usuario uq_usuario_email_asoc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT uq_usuario_email_asoc UNIQUE (email, asociacion_id);


--
-- TOC entry 4972 (class 2606 OID 25072)
-- Name: usuario usuario_cedula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_cedula_key UNIQUE (cedula);


--
-- TOC entry 4974 (class 2606 OID 24734)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 5018 (class 2606 OID 24935)
-- Name: venta venta_numero_factura_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_numero_factura_key UNIQUE (numero_factura);


--
-- TOC entry 5020 (class 2606 OID 24933)
-- Name: venta venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id_venta);


--
-- TOC entry 5041 (class 1259 OID 33435)
-- Name: idx_comerciante_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comerciante_asociacion ON public.comerciante USING btree (asociacion_id);


--
-- TOC entry 5013 (class 1259 OID 33442)
-- Name: idx_compra_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_compra_asociacion ON public.compra USING btree (asociacion_id);


--
-- TOC entry 5044 (class 1259 OID 33407)
-- Name: idx_entrega_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrega_asociacion ON public.entrega USING btree (asociacion_id);


--
-- TOC entry 5045 (class 1259 OID 33314)
-- Name: idx_entrega_estado_liq; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrega_estado_liq ON public.entrega USING btree (estado_liquidacion);


--
-- TOC entry 5046 (class 1259 OID 33318)
-- Name: idx_entrega_estado_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrega_estado_pago ON public.entrega USING btree (estado_pago);


--
-- TOC entry 5047 (class 1259 OID 33313)
-- Name: idx_entrega_ruta_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrega_ruta_id ON public.entrega USING btree (ruta_id);


--
-- TOC entry 5048 (class 1259 OID 33370)
-- Name: idx_entrega_tipo_productor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_entrega_tipo_productor ON public.entrega USING btree (tipo_productor);


--
-- TOC entry 5049 (class 1259 OID 33285)
-- Name: idx_precios_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_precios_activo ON public.precios USING btree (activo);


--
-- TOC entry 5050 (class 1259 OID 33428)
-- Name: idx_precios_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_precios_asociacion ON public.precios USING btree (asociacion_id);


--
-- TOC entry 5051 (class 1259 OID 33286)
-- Name: idx_precios_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_precios_fecha ON public.precios USING btree (fecha DESC);


--
-- TOC entry 5052 (class 1259 OID 33284)
-- Name: idx_precios_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_precios_producto ON public.precios USING btree (id_producto);


--
-- TOC entry 4998 (class 1259 OID 33421)
-- Name: idx_producto_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_producto_asociacion ON public.producto USING btree (asociacion_id);


--
-- TOC entry 4987 (class 1259 OID 33400)
-- Name: idx_productor_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productor_asociacion ON public.productor USING btree (asociacion_id);


--
-- TOC entry 5055 (class 1259 OID 33315)
-- Name: idx_ruta_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ruta_estado ON public.ruta USING btree (estado);


--
-- TOC entry 5056 (class 1259 OID 33369)
-- Name: idx_ruta_id_operario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ruta_id_operario ON public.ruta USING btree (id_operario);


--
-- TOC entry 4968 (class 1259 OID 33391)
-- Name: idx_usuario_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_asociacion ON public.usuario USING btree (asociacion_id);


--
-- TOC entry 5016 (class 1259 OID 33414)
-- Name: idx_venta_asociacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_venta_asociacion ON public.venta USING btree (asociacion_id);


--
-- TOC entry 5101 (class 2606 OID 33430)
-- Name: comerciante comerciante_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comerciante
    ADD CONSTRAINT comerciante_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5082 (class 2606 OID 33437)
-- Name: compra compra_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT compra_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5102 (class 2606 OID 33402)
-- Name: entrega entrega_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega
    ADD CONSTRAINT entrega_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5103 (class 2606 OID 33305)
-- Name: entrega entrega_ruta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega
    ADD CONSTRAINT entrega_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.ruta(id_ruta) ON DELETE SET NULL;


--
-- TOC entry 5071 (class 2606 OID 24763)
-- Name: administrador fk_administrador_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT fk_administrador_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5094 (class 2606 OID 24987)
-- Name: codigo_qr fk_codigo_qr_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_qr
    ADD CONSTRAINT fk_codigo_qr_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- TOC entry 5095 (class 2606 OID 24992)
-- Name: codigo_qr fk_codigo_qr_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_qr
    ADD CONSTRAINT fk_codigo_qr_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor) ON DELETE CASCADE;


--
-- TOC entry 5083 (class 2606 OID 24899)
-- Name: compra fk_compra_operario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT fk_compra_operario FOREIGN KEY (id_operario) REFERENCES public.operario(id_operario) ON DELETE RESTRICT;


--
-- TOC entry 5084 (class 2606 OID 24904)
-- Name: compra fk_compra_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra
    ADD CONSTRAINT fk_compra_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor) ON DELETE RESTRICT;


--
-- TOC entry 5097 (class 2606 OID 25023)
-- Name: confirmacion_ruta fk_confirmacion_ruta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.confirmacion_ruta
    ADD CONSTRAINT fk_confirmacion_ruta FOREIGN KEY (id_ruta) REFERENCES public.ruta_planificacion(id_ruta) ON DELETE CASCADE;


--
-- TOC entry 5085 (class 2606 OID 24916)
-- Name: detalle_compra fk_detalle_compra_compra; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT fk_detalle_compra_compra FOREIGN KEY (id_compra) REFERENCES public.compra(id_compra) ON DELETE CASCADE;


--
-- TOC entry 5086 (class 2606 OID 24921)
-- Name: detalle_compra fk_detalle_compra_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_compra
    ADD CONSTRAINT fk_detalle_compra_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE RESTRICT;


--
-- TOC entry 5090 (class 2606 OID 24953)
-- Name: detalle_venta fk_detalle_venta_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT fk_detalle_venta_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE RESTRICT;


--
-- TOC entry 5091 (class 2606 OID 24948)
-- Name: detalle_venta fk_detalle_venta_venta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT fk_detalle_venta_venta FOREIGN KEY (id_venta) REFERENCES public.venta(id_venta) ON DELETE CASCADE;


--
-- TOC entry 5077 (class 2606 OID 24841)
-- Name: historial_precio fk_historial_precio_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_precio
    ADD CONSTRAINT fk_historial_precio_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- TOC entry 5092 (class 2606 OID 24966)
-- Name: historial_transaccion fk_historial_transaccion_compra; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_transaccion
    ADD CONSTRAINT fk_historial_transaccion_compra FOREIGN KEY (id_compra) REFERENCES public.compra(id_compra) ON DELETE SET NULL;


--
-- TOC entry 5093 (class 2606 OID 24971)
-- Name: historial_transaccion fk_historial_transaccion_venta; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_transaccion
    ADD CONSTRAINT fk_historial_transaccion_venta FOREIGN KEY (id_venta) REFERENCES public.venta(id_venta) ON DELETE SET NULL;


--
-- TOC entry 5100 (class 2606 OID 25065)
-- Name: modo_offline fk_modo_offline_operario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modo_offline
    ADD CONSTRAINT fk_modo_offline_operario FOREIGN KEY (id_operario) REFERENCES public.operario(id_operario) ON DELETE CASCADE;


--
-- TOC entry 5111 (class 2606 OID 33358)
-- Name: stock_movimiento fk_movimiento_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movimiento
    ADD CONSTRAINT fk_movimiento_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- TOC entry 5104 (class 2606 OID 25102)
-- Name: entrega fk_operario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega
    ADD CONSTRAINT fk_operario FOREIGN KEY (id_operario) REFERENCES public.usuario(id_usuario);


--
-- TOC entry 5072 (class 2606 OID 24777)
-- Name: operario fk_operario_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operario
    ADD CONSTRAINT fk_operario_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5075 (class 2606 OID 24812)
-- Name: perfil_productor fk_perfil_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.perfil_productor
    ADD CONSTRAINT fk_perfil_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor) ON DELETE CASCADE;


--
-- TOC entry 5078 (class 2606 OID 24859)
-- Name: produccion fk_produccion_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion
    ADD CONSTRAINT fk_produccion_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- TOC entry 5079 (class 2606 OID 24854)
-- Name: produccion fk_produccion_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produccion
    ADD CONSTRAINT fk_produccion_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor) ON DELETE CASCADE;


--
-- TOC entry 5105 (class 2606 OID 25112)
-- Name: entrega fk_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega
    ADD CONSTRAINT fk_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- TOC entry 5106 (class 2606 OID 25107)
-- Name: entrega fk_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entrega
    ADD CONSTRAINT fk_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor);


--
-- TOC entry 5073 (class 2606 OID 24795)
-- Name: productor fk_productor_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productor
    ADD CONSTRAINT fk_productor_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5080 (class 2606 OID 24871)
-- Name: proyeccion fk_proyeccion_produccion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyeccion
    ADD CONSTRAINT fk_proyeccion_produccion FOREIGN KEY (id_produccion) REFERENCES public.produccion(id_produccion) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 25050)
-- Name: ranking_productor fk_ranking_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ranking_productor
    ADD CONSTRAINT fk_ranking_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 25038)
-- Name: reporte fk_reporte_administrador; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reporte
    ADD CONSTRAINT fk_reporte_administrador FOREIGN KEY (id_administrador) REFERENCES public.administrador(id_administrador) ON DELETE CASCADE;


--
-- TOC entry 5096 (class 2606 OID 25008)
-- Name: ruta_planificacion fk_ruta_planificacion_productor; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta_planificacion
    ADD CONSTRAINT fk_ruta_planificacion_productor FOREIGN KEY (id_productor) REFERENCES public.productor(id_productor) ON DELETE CASCADE;


--
-- TOC entry 5070 (class 2606 OID 24747)
-- Name: sesion fk_sesion_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5110 (class 2606 OID 33342)
-- Name: stock fk_stock_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- TOC entry 5081 (class 2606 OID 24884)
-- Name: tendencia fk_tendencia_proyeccion; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tendencia
    ADD CONSTRAINT fk_tendencia_proyeccion FOREIGN KEY (id_proyeccion) REFERENCES public.proyeccion(id_proyeccion) ON DELETE CASCADE;


--
-- TOC entry 5087 (class 2606 OID 25087)
-- Name: venta fk_venta_comerciante; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT fk_venta_comerciante FOREIGN KEY (id_comerciante) REFERENCES public.comerciante(id_comerciante);


--
-- TOC entry 5088 (class 2606 OID 33324)
-- Name: venta fk_venta_operario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT fk_venta_operario FOREIGN KEY (id_operario) REFERENCES public.operario(id_operario) ON DELETE SET NULL;


--
-- TOC entry 5107 (class 2606 OID 33423)
-- Name: precios precios_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precios
    ADD CONSTRAINT precios_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5108 (class 2606 OID 33279)
-- Name: precios precios_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.precios
    ADD CONSTRAINT precios_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE RESTRICT;


--
-- TOC entry 5076 (class 2606 OID 33416)
-- Name: producto producto_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5074 (class 2606 OID 33395)
-- Name: productor productor_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productor
    ADD CONSTRAINT productor_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5109 (class 2606 OID 33364)
-- Name: ruta ruta_id_operario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ruta
    ADD CONSTRAINT ruta_id_operario_fkey FOREIGN KEY (id_operario) REFERENCES public.usuario(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 5069 (class 2606 OID 33386)
-- Name: usuario usuario_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


--
-- TOC entry 5089 (class 2606 OID 33409)
-- Name: venta venta_asociacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_asociacion_id_fkey FOREIGN KEY (asociacion_id) REFERENCES public.asociaciones(id) ON DELETE RESTRICT;


-- Completed on 2026-07-28 16:19:00

--
-- PostgreSQL database dump complete
--

\unrestrict 0ZhEOzRd7jAKdNyeRo3AL7LcaVOcikxyaQFJ0Cs778VCFQHWIqrvIraT7CQt73I

