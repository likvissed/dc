require 'rails_helper'

RSpec.describe "server_types/new", type: :view do

  let(:server_type) { build(:server_type) }
  before do
    assign(:server_type, server_type)
    render
  end

  it "renders form with server_type action" do
    expect(rendered).to have_selector("form[action='#{server_types_path}']")
  end

  it "renders form with post method" do
    expect(rendered).to have_selector("form[method='post']")
  end

  it "renders form with serv-type-form directive" do
    expect(rendered).to have_selector("form[serv-type-form='0']")
  end

  it "renders \"ready\" button with name='commit'" do
    expect(rendered).to have_selector("input[name='commit']")
  end

  it "renders \"ready\" button with value='Готово'" do
    expect(rendered).to have_selector("input[value='Готово']")
  end

  it "renders \"cancel\" button with name='cancel'" do
    expect(rendered).to have_selector("button[name='cancel']")
  end

  it "renders \"cancel\" button with value='true'" do
    expect(rendered).to have_selector("button[value='true']")
  end

end

RSpec.describe "server_types/new", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:server_part) { create_list(:server_part, 3) }
  before do
    login_as admin_user
    visit new_server_type_path
  end

  let(:current_hidden_field) { page.find(".row").all("input[type='hidden']", visible: false).map{ |input| input[:name][/\[id\]$|\[_destroy\]$/] } }

  it "render hidden field for server_part" do
    expect(current_hidden_field).to match_array(["[id]", "[_destroy]"])
  end

  context "when click the cancel button" do
    before { click_button "Отмена" }

    it "redirects to index page" do
      expect(current_path).to eq server_types_path
    end
  end

  context "when json response is received" do
    context "when click a plus button" do
      before { page.find("button[ng-click='addServPart()']").click }

      it "add one more row" do
        expect(page).to have_selector(".row", count: 2)
      end
    end

    context "when click a plus and a minus button" do
      before do
        page.find("button[ng-click='addServPart()']").click
        page.all("button[ng-click='delServPart(detail)']").last.click
      end

      it "does not change count of row" do
        expect(page).to have_selector(".row", count: 1)
      end
    end
  end

  context "when sends empty data" do
    before { click_button "Готово" }

    it "renders page with alert" do
      expect(page).to have_selector("div[data-alert]")
    end

    it "renders form with server_types action" do
      expect(page).to have_selector("form[action='#{server_types_path}']")
    end

    it "renders form with post method" do
      expect(page).to have_selector("form[method='post']")
    end
  end

end