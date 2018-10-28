namespace Benifitinatoratronic.Models
{
    public class HubFailureResponse : HubResponse
    {
        public HubFailureResponse(string _message)
        {
            success = false;
            message = _message;
        }
    }
}