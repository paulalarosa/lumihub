-- Migration Phase 19: Centralized Templated Mailer
-- This migration introduces a unified SQL helper to call the SES Edge Function.

-- 1. Create the centralized email helper
CREATE OR REPLACE FUNCTION public.send_templated_email(
    recipient TEXT,
    template_name TEXT,
    template_data JSONB,
    user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-ses-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
        ),
        body := jsonb_build_object(
            'to', jsonb_build_array(recipient),
            'template', template_name,
            'templateData', template_data,
            'userId', user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Refactor Welcome Email Trigger (on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.send_templated_email(
        new.email,
        'Khaos_Welcome',
        jsonb_build_object(
            'name', COALESCE(new.raw_user_meta_data->>'name', 'Cliente'),
            'email', new.email
        ),
        new.id
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Refactor Invoice Feedback Trigger
CREATE OR REPLACE FUNCTION public.handle_invoice_paid_feedback()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        PERFORM public.send_templated_email(
            (SELECT email FROM public.wedding_clients WHERE id = NEW.client_id),
            'Khaos_Feedback',
            jsonb_build_object(
                'name', (SELECT name FROM public.wedding_clients WHERE id = NEW.client_id),
                'order_id', NEW.id,
                'amount', NEW.amount
            ),
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Refactor Project Tracking Trigger
CREATE OR REPLACE FUNCTION public.handle_project_tracking()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
        PERFORM public.send_templated_email(
            (SELECT email FROM public.wedding_clients WHERE id = NEW.client_id),
            'Khaos_Tracking',
            jsonb_build_object(
                'name', (SELECT name FROM public.wedding_clients WHERE id = NEW.client_id),
                'project_name', NEW.name,
                'status', 'Em Andamento'
            ),
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.send_templated_email IS 'Central KONTROL Mailer - Unified SES Dispatch v1.0';
