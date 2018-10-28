namespace Benifitinatoratronic.Models
{
    public class HubSuccessResponse : HubResponse
    {
        public HubSuccessResponse(object _payload)
        {
            success = true;
            payload = _payload;
        }
    }
}