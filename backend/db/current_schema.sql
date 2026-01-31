--
-- PostgreSQL database dump
--

\restrict IVVpuF34Z0NIhqgLRYDNoY0Iwa8FbfadoeT2tUlbdConpvGa5IorMbLJmP9xgYi

-- Dumped from database version 15.15 (Homebrew)
-- Dumped by pg_dump version 15.15 (Homebrew)

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
-- Name: analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analyses (
    id character varying(100) NOT NULL,
    brand_id character varying(50) NOT NULL,
    location_lat numeric(10,7) NOT NULL,
    location_lng numeric(10,7) NOT NULL,
    location_address text,
    radius integer NOT NULL,
    initial_investment bigint NOT NULL,
    monthly_rent bigint NOT NULL,
    area integer NOT NULL,
    owner_working boolean NOT NULL,
    target_daily_sales integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    result jsonb,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    "position" character varying(20) NOT NULL,
    initial_investment bigint NOT NULL,
    monthly_royalty numeric(5,2) NOT NULL,
    monthly_marketing numeric(5,2) NOT NULL,
    avg_daily_sales integer NOT NULL,
    pdf_source text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avg_monthly_revenue bigint,
    avg_revenue_per_area numeric(10,2),
    avg_store_count integer
);


--
-- Name: analyses analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: idx_analyses_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analyses_brand_id ON public.analyses USING btree (brand_id);


--
-- Name: idx_analyses_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analyses_created_at ON public.analyses USING btree (created_at);


--
-- Name: idx_analyses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analyses_status ON public.analyses USING btree (status);


--
-- Name: analyses analyses_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analyses
    ADD CONSTRAINT analyses_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- PostgreSQL database dump complete
--

\unrestrict IVVpuF34Z0NIhqgLRYDNoY0Iwa8FbfadoeT2tUlbdConpvGa5IorMbLJmP9xgYi

